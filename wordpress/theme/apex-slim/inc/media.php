<?php
/**
 * Pictures.
 *
 * Uploads: a JPEG or PNG is saved again as WebP at quality 82 and the WebP copy replaces it when it is
 * smaller. Settings › Media › "Save uploaded photos as WebP" turns this off.
 *
 * Results pods: the Results section shows each case's before and after inside the pod, on a 600 x 900 card
 * with the photo fitted into the middle 580 x 700 and the rest filled with the photo's own corner colour
 * (the same as tools/cindy_prep.py). Saving a case cuts these from its two photos into uploads/slim-pods/.
 */
defined( 'ABSPATH' ) || exit;

function slim_webp_on(): bool { return (bool) get_option( 'slim_webp', 1 ); }

/** Saves a JPEG or PNG as WebP. True only when the WebP file is a readable image and lighter than the original. */
function slim_to_webp( string $from, string $to, int $q = 82 ): bool {
	$size = @filesize( $from );
	$info = @getimagesize( $from );
	if ( ! $size || ! $info ) return false;
	if ( $info[2] === IMAGETYPE_PNG && function_exists( 'imagewebp' ) ) {
		// GD cannot write a palette PNG as WebP until it holds full colour
		$im = @imagecreatefrompng( $from );
		if ( ! $im ) return false;
		if ( ! imageistruecolor( $im ) ) imagepalettetotruecolor( $im );
		imagealphablending( $im, false );
		imagesavealpha( $im, true );
		$ok = @imagewebp( $im, $to, $q );
		imagedestroy( $im );
	} else {
		$ed = wp_get_image_editor( $from );
		if ( is_wp_error( $ed ) ) return false;
		if ( method_exists( $ed, 'maybe_exif_rotate' ) ) $ed->maybe_exif_rotate();   // phone photos keep the right way up
		$ed->set_quality( $q );
		$ok = ! is_wp_error( $ed->save( $to, 'image/webp' ) );
	}
	clearstatcache( true, $to );
	if ( $ok && is_file( $to ) && filesize( $to ) > 0 && filesize( $to ) < $size && @getimagesize( $to ) ) return true;
	if ( is_file( $to ) ) wp_delete_file( $to );
	return false;
}

add_filter( 'wp_handle_upload', function ( array $u ) {
	if ( ! slim_webp_on() || ! empty( $u['error'] ) || ! in_array( $u['type'] ?? '', [ 'image/jpeg', 'image/png' ], true ) ) return $u;
	if ( ! wp_image_editor_supports( [ 'mime_type' => 'image/webp' ] ) ) return $u;
	$info = pathinfo( $u['file'] );
	$name = $info['filename'] . '.webp';
	if ( file_exists( $info['dirname'] . '/' . $name ) ) $name = wp_unique_filename( $info['dirname'], $name );
	$to = $info['dirname'] . '/' . $name;
	if ( ! slim_to_webp( $u['file'], $to ) ) return $u;
	wp_delete_file( $u['file'] );
	return [ 'file' => $to, 'url' => dirname( $u['url'] ) . '/' . $name, 'type' => 'image/webp' ] + $u;
} );

add_action( 'admin_init', function () {
	register_setting( 'media', 'slim_webp', [ 'type' => 'integer', 'default' => 1, 'sanitize_callback' => fn( $v ) => $v ? 1 : 0 ] );
	add_settings_field( 'slim_webp', __( 'Save uploaded photos as WebP', 'slim' ), function () {
		echo '<label><input type="checkbox" name="slim_webp" value="1"' . checked( slim_webp_on(), true, false ) . '> ' . esc_html__( 'JPEG and PNG uploads are saved as WebP, which loads faster. The original is not kept.', 'slim' ) . '</label>';
	}, 'media', 'default' );
} );

/* ---------- Results pods ---------- */
/** Cuts one pod picture from a photo file. */
function slim_pod_file( string $from, string $to ): bool {
	if ( ! function_exists( 'imagewebp' ) ) return false;
	$s = @imagecreatefromstring( (string) @file_get_contents( $from ) );
	if ( ! $s ) return false;
	$w = imagesx( $s ); $h = imagesy( $s );
	$r = $g = $b = 0;
	foreach ( [ [ 2, 2 ], [ $w - 3, 2 ], [ 2, $h - 3 ], [ $w - 3, $h - 3 ] ] as [ $x, $y ] ) {
		$c = imagecolorsforindex( $s, imagecolorat( $s, max( 0, $x ), max( 0, $y ) ) );
		$r += $c['red']; $g += $c['green']; $b += $c['blue'];
	}
	$out = imagecreatetruecolor( 600, 900 );
	imagefill( $out, 0, 0, imagecolorallocate( $out, intdiv( $r, 4 ), intdiv( $g, 4 ), intdiv( $b, 4 ) ) );
	$sc = min( 580 / $w, 700 / $h );
	$nw = max( 1, (int) round( $w * $sc ) ); $nh = max( 1, (int) round( $h * $sc ) );
	imagecopyresampled( $out, $s, intdiv( 600 - $nw, 2 ), intdiv( 900 - $nh, 2 ), 0, 0, $nw, $nh, $w, $h );
	$ok = @imagewebp( $out, $to, 86 );
	imagedestroy( $s ); imagedestroy( $out );
	return $ok && is_file( $to ) && filesize( $to ) > 0;
}

/** Makes a case's pod pictures when its photos changed. Photos that ship with the theme keep the pods made for them. */
function slim_case_pods( int $id ): void {
	$p = get_post( $id );
	if ( ! $p ) return;
	$v = slim_read_post( $p, 'slim_case' );
	$raw = (array) $v['raw'];
	$b = (string) ( $raw['before'] ?? '' ); $a = (string) ( $raw['after'] ?? '' );
	if ( $b === '' || $a === '' ) return;
	$sig = md5( $b . '|' . $a );
	$pod = (array) $v['pod'];
	if ( count( $pod ) === 2 && get_post_meta( $id, '_slim_pod_sig', true ) === $sig ) return;
	if ( count( $pod ) === 2 && str_starts_with( $pod[0], 'img/' ) && get_post_meta( $id, '_slim_pod_sig', true ) === '' ) {   // imported with the theme's own pods
		update_post_meta( $id, '_slim_pod_sig', $sig );
		return;
	}
	$up = wp_upload_dir( null, false );
	$dir = trailingslashit( $up['basedir'] ) . 'slim-pods';
	wp_mkdir_p( $dir );
	$out = [];
	foreach ( [ 'before' => $b, 'after' => $a ] as $k => $src ) {
		$file = slim_img_file( $src );
		$name = sanitize_file_name( $p->post_name ?: 'case-' . $id ) . "-$k-" . substr( $sig, 0, 6 ) . '.webp';
		if ( ! $file || ! is_file( $file ) || ! slim_pod_file( $file, "$dir/$name" ) ) return;   // leaves the old pods in place
		$out[] = slim_img_store( trailingslashit( $up['baseurl'] ) . "slim-pods/$name" );
	}
	slim_write_post( $id, 'slim_case', [ 'pod' => $out ] );
	update_post_meta( $id, '_slim_pod_sig', $sig );
}

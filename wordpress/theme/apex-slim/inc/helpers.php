<?php
/**
 * Images, links and escaping shared by the templates and the admin.
 *
 * Content stores pictures in one of two forms, so it survives a change of domain:
 *   img/tx/device-emsculpt-neo.webp       a picture that ships with the theme (assets/img/...)
 *   ~/wp-content/uploads/2026/12/x.webp   a picture uploaded through the media library
 */
defined( 'ABSPATH' ) || exit;

/** The six goals of the mixing bench and the form. Each has its own bottle picture, so the list is fixed. */
const SLIM_GOALS = [
	'weight' => 'Lose weight', 'fat' => 'Belly and flank fat', 'tone' => 'Muscle tone',
	'firm' => 'Firmer buttocks', 'energy' => 'Energy and recovery', 'sleep' => 'Sleep without snoring',
];
/** Each bottle's picture version, as in index.html. */
const SLIM_BOTTLE_V = [ 'weight' => 4, 'fat' => 4, 'tone' => 4, 'firm' => 5, 'energy' => 5, 'sleep' => 4 ];

/** Treatment icons, drawn on the periodic-table tiles. A new treatment picks one of these in the admin. */
const SLIM_ICONS = [
	'Wk' => '<rect x="3.5" y="4" width="17" height="16" rx="4"/><path d="M8 9.5a4 4 0 0 1 8 0"/><path d="M12 9.5l2-2.2"/><path d="M8 16h8"/>',
	'Cs' => '<path d="M12 2.5v19M3.8 7.2l16.4 9.6M3.8 16.8l16.4-9.6"/><path d="M9.5 4l2.5 2.5L14.5 4M9.5 20l2.5-2.5 2.5 2.5M4.3 11l3.4 1-1 3.4M19.7 13l-3.4-1 1-3.4"/>',
	'En' => '<path d="M13.5 2.5 5.5 13.5h6l-1 8 8-11h-6z"/>',
	'Ff' => '<path d="M6 8.5v7M18 8.5v7M3.5 10v4M20.5 10v4M6 12h12"/>',
	'Iv' => '<path d="M7 3.5h10v8.5a5 5 0 0 1-10 0z"/><path d="M7 8h10M12 17v2.5M12 19.5c0 1.4 1 2 2.5 2"/><path d="M10 11.5h4"/>',
	'Hb' => '<circle cx="9" cy="14" r="5.5"/><circle cx="17" cy="7.5" r="3.5"/><circle cx="18.5" cy="16.5" r="2"/><path d="M7.4 12.4a2.3 2.3 0 0 1 2.4-1"/>',
	'Sl' => '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/><path d="M15 3.5h4l-4 4h4"/>',
];
const SLIM_ICON_NAMES = [ 'Wk' => 'Scale (1 Week 1 Kilo)', 'Cs' => 'Snowflake (CoolSculpting)', 'En' => 'Lightning (Emsculpt Neo)', 'Ff' => 'Waves (FIT FIRM)', 'Iv' => 'Drip bag (IV Therapy)', 'Hb' => 'Bubbles (HBOT)', 'Sl' => 'Moon (Snorelase)' ];
const SLIM_ASK_ICON = '<path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16"/><circle cx="12" cy="8.2" r="1.8"/><path d="M8.8 17v-2.2a3.2 3.2 0 0 1 6.4 0V17"/>';

/** Labels over the CoolSculpting body map (img/tx/ppt-map.webp, Allergan's figure with its own labels removed). */
const SLIM_MAP_FILE = 'img/tx/ppt-map.webp';
const SLIM_MAP_LABELS = '<polyline points="455,152 385,152 356,178" fill="none" stroke="#0C69B2" stroke-width="1.6"/><circle cx="455" cy="152" r="2.6" fill="#0C69B2"/><text x="190" y="110" text-anchor="end">Upper arms</text><text x="190" y="251" text-anchor="end">Flanks</text><text x="190" y="348" text-anchor="end">Under the</text><text x="190" y="376" text-anchor="end">buttocks</text><text x="190" y="479" text-anchor="end">Outer thighs</text><text x="190" y="528" text-anchor="end">Above the</text><text x="190" y="556" text-anchor="end">knees</text><text x="486" y="634" text-anchor="end">Male</text><text x="486" y="662" text-anchor="end">chest</text><text x="462" y="110">Under the chin</text><text x="462" y="159">Fat by the armpit</text><text x="462" y="206">Bra line</text><text x="462" y="358">Belly</text><text x="462" y="480">Inner thighs</text>';

/** A file that ships with the theme, under assets/. */
function slim_asset( string $p ): string {
	return SLIM_URI . '/assets/' . ltrim( $p, '/' );
}
function slim_media_base(): string {
	if ( defined( 'SLIM_MEDIA_BASE' ) ) return trailingslashit( SLIM_MEDIA_BASE );
	return trailingslashit( get_option( 'home' ) );
}
/** A stored picture as an address the browser can load. */
function slim_img( $s ): string {
	$s = (string) ( $s ?? '' );
	if ( $s === '' ) return '';
	if ( str_starts_with( $s, '~/' ) ) return slim_media_base() . substr( $s, 2 );
	if ( preg_match( '#^(img|video|lab)/#', $s ) ) return slim_asset( $s );
	return $s;
}
/** The reverse, for storing: an upload on this site becomes "~/..." so content survives a domain move. */
function slim_img_store( $s ): string {
	$s = trim( (string) $s );
	foreach ( array_unique( [ trailingslashit( get_option( 'home' ) ), slim_media_base() ] ) as $b ) {
		if ( $b && str_starts_with( $s, $b . 'wp-content/' ) ) return '~/' . substr( $s, strlen( $b ) );
	}
	$theme = SLIM_URI . '/assets/';
	if ( str_starts_with( $s, $theme ) ) return substr( $s, strlen( $theme ) );
	return $s;
}
/** The file on disk behind a stored picture, or '' when it is elsewhere. */
function slim_img_file( string $s ): string {
	if ( preg_match( '#^(img|video|lab)/#', $s ) ) return SLIM_DIR . '/assets/' . $s;
	if ( str_starts_with( $s, '~/wp-content/' ) ) return WP_CONTENT_DIR . '/' . rawurldecode( substr( $s, strlen( '~/wp-content/' ) ) );
	return '';
}
/** Width and height of a stored picture, so the page does not jump while photos load. */
function slim_dims( string $s ): ?array {
	static $memo = [];
	if ( array_key_exists( $s, $memo ) ) return $memo[ $s ];
	$f = slim_img_file( $s );
	$d = $f && is_file( $f ) ? @getimagesize( $f ) : false;
	return $memo[ $s ] = $d ? [ (int) $d[0], (int) $d[1] ] : null;
}
/** An <img> for a stored picture, sized; lazy pictures decode off the main thread. */
function slim_img_tag( string $src, string $alt, bool $lazy = true, string $extra = '' ): string {
	if ( $src === '' ) return '';
	$o = '<img src="' . esc_url( slim_img( $src ) ) . '" alt="' . esc_attr( $alt ) . '"' . ( $lazy ? ' loading="lazy"' : '' ) . $extra;
	if ( $d = slim_dims( $src ) ) $o .= ' width="' . $d[0] . '" height="' . $d[1] . '"' . ( $lazy ? ' decoding="async"' : '' );
	return $o . '>';
}

/** Plain text for the page. Entities typed into content (&amp;) stay single. */
function slim_t( $s ): string { return esc_html( (string) ( $s ?? '' ) ); }
/** Text that may hold links and inline formatting (sources, answers, the protocol table). */
function slim_h( $s ): string { return wp_kses_post( (string) ( $s ?? '' ) ); }

/** Addresses of the fixed pages. */
function slim_page_id( string $k ): int {
	static $ids = null;
	if ( $ids === null ) {
		$ids = [];
		$q = get_posts( [ 'post_type' => 'page', 'post_status' => [ 'publish', 'private', 'draft' ], 'meta_key' => '_slim_page', 'numberposts' => 20, 'fields' => 'ids', 'no_found_rows' => true ] );
		foreach ( $q as $id ) $ids[ (string) get_post_meta( $id, '_slim_page', true ) ] ??= (int) $id;
	}
	return $ids[ $k ] ?? 0;
}
function slim_home(): string { return home_url( '/' ); }
function slim_lab_url(): string { $id = slim_page_id( 'lab' ); return $id ? get_permalink( $id ) : home_url( '/lab/' ); }
function slim_privacy_url(): string { $id = (int) get_option( 'wp_page_for_privacy_policy' ); return $id && get_post_status( $id ) === 'publish' ? get_permalink( $id ) : ''; }

/** The site's settings (Apex Slim › Settings). */
function slim_settings(): array {
	static $s = null;
	if ( $s === null ) { $s = get_option( 'slim_settings' ); $s = is_array( $s ) ? $s : []; }
	return $s;
}
function slim_set( string $k, $def = '' ) {
	$v = slim_settings()[ $k ] ?? null;
	return $v === null || $v === '' || $v === [] ? $def : $v;
}

/** The visitor's address, for rate limits. Behind Cloudflare or a proxy, set define( 'SLIM_IP_HEADER', 'HTTP_CF_CONNECTING_IP' ). */
function slim_client_ip(): string {
	if ( defined( 'SLIM_IP_HEADER' ) && ! empty( $_SERVER[ SLIM_IP_HEADER ] ) ) {
		$ip = trim( explode( ',', (string) $_SERVER[ SLIM_IP_HEADER ] )[0] );
		if ( filter_var( $ip, FILTER_VALIDATE_IP ) ) return $ip;
	}
	return (string) ( $_SERVER['REMOTE_ADDR'] ?? '' );
}
/** A one-way fingerprint of the visitor's address, so the address itself is never stored. */
function slim_ip_hash(): string {
	return substr( hash_hmac( 'sha256', slim_client_ip(), wp_salt( 'nonce' ) ), 0, 16 );
}

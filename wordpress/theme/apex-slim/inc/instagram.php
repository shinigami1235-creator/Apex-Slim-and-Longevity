<?php
/**
 * Instagram feed on the home page: the latest posts of Apex Slim's Instagram account.
 *
 * The server fetches the posts every hour through the Instagram API with Instagram Login (graph.instagram.com),
 * keeps a square copy of each picture in wp-content/uploads/slim-ig and shows those copies, so a page view never
 * calls Instagram and no visitor data goes to Meta. The access token is refreshed once a week since a long-lived
 * token stops working 60 days after it was made or last refreshed.
 *
 * Staging to live: copy the database (it holds the token and the post list) and the uploads folder.
 * A picture missing after the copy is downloaded again at the next fetch.
 */
defined( 'ABSPATH' ) || exit;

const SLIM_IG_DIR = 'slim-ig';

function slim_ig(): array {
	return (array) get_option( 'slim_ig', [] ) + [ 'token' => '', 'user' => '', 'show' => 6, 'title' => 'On Instagram', 'items' => [], 'error' => '' ];
}
function slim_ig_save( array $ig ): void { update_option( 'slim_ig', $ig, false ); }
function slim_ig_api(): string { return (string) apply_filters( 'slim_ig_api', 'https://graph.instagram.com' ); }

/** Only Instagram's picture servers. */
function slim_ig_host_ok( string $url ): bool {
	if ( ! preg_match( '#^https?://#i', $url ) ) return false;
	$h = strtolower( (string) wp_parse_url( $url, PHP_URL_HOST ) );
	foreach ( (array) apply_filters( 'slim_ig_hosts', [ 'cdninstagram.com', 'fbcdn.net' ] ) as $ok ) {
		if ( $h === $ok || str_ends_with( $h, '.' . $ok ) ) return true;
	}
	return false;
}

/** @return array|WP_Error */
function slim_ig_get( string $path, array $args ) {
	$r = wp_remote_get( add_query_arg( array_map( 'rawurlencode', $args ), slim_ig_api() . $path ), [ 'timeout' => 15 ] );
	if ( is_wp_error( $r ) ) return $r;
	$code = (int) wp_remote_retrieve_response_code( $r );
	$body = json_decode( wp_remote_retrieve_body( $r ), true );
	if ( $code !== 200 || ! is_array( $body ) ) {
		return new WP_Error( 'slim_ig', is_array( $body ) && isset( $body['error']['message'] ) ? (string) $body['error']['message'] : "Instagram answered HTTP $code." );
	}
	return $body;
}

function slim_ig_dir(): array {
	$up = wp_upload_dir( null, false );
	return [ trailingslashit( $up['basedir'] ) . SLIM_IG_DIR, trailingslashit( $up['baseurl'] ) . SLIM_IG_DIR ];
}

/** Fetches the latest posts and their pictures. Returns '' or the error. A failed fetch keeps the posts already shown. */
function slim_ig_fetch(): string {
	$ig = slim_ig();
	if ( $ig['token'] === '' ) return 'No access token.';
	$ig['checked'] = time();
	$res = slim_ig_get( '/me/media', [ 'fields' => 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp', 'limit' => '12', 'access_token' => $ig['token'] ] );
	if ( is_wp_error( $res ) ) {
		$ig['error'] = $res->get_error_message();
		slim_ig_save( $ig );
		return $ig['error'];
	}
	require_once ABSPATH . 'wp-admin/includes/file.php';
	[ $dir ] = slim_ig_dir();
	wp_mkdir_p( $dir );
	$items = [];
	foreach ( (array) ( $res['data'] ?? [] ) as $m ) {
		$id = preg_replace( '/\D/', '', (string) ( $m['id'] ?? '' ) );
		$link = (string) ( $m['permalink'] ?? '' );
		$src = (string) ( ( $m['media_type'] ?? '' ) === 'VIDEO' ? ( $m['thumbnail_url'] ?? '' ) : ( $m['media_url'] ?? '' ) );
		if ( $id === '' || ! preg_match( '#^https://(www\.)?instagram\.com/[\w/.-]+$#', $link ) ) continue;
		$file = $id . '.jpg';
		if ( ! is_file( "$dir/$file" ) ) {
			if ( ! slim_ig_host_ok( $src ) ) continue;
			$tmp = download_url( $src, 20 );
			if ( is_wp_error( $tmp ) ) continue;
			$ed = wp_get_image_editor( $tmp );
			if ( is_wp_error( $ed ) ) { @unlink( $tmp ); continue; }
			$sz = $ed->get_size();
			$side = min( $sz['width'], $sz['height'] );
			$ed->crop( intdiv( $sz['width'] - $side, 2 ), intdiv( $sz['height'] - $side, 2 ), $side, $side, min( 640, $side ), min( 640, $side ) );
			$ed->set_quality( 82 );
			$ok = ! is_wp_error( $ed->save( "$dir/$file", 'image/jpeg' ) );
			@unlink( $tmp );
			if ( ! $ok ) continue;
		}
		$cap = trim( strtok( (string) ( $m['caption'] ?? '' ), "\n" ) ?: '' );
		$px = (int) ( wp_getimagesize( "$dir/$file" )[0] ?? 640 );
		$items[] = [ 'id' => $id, 'link' => $link, 'file' => $file, 'px' => $px, 'alt' => wp_html_excerpt( $cap, 120, '…' ), 'ts' => strtotime( (string) ( $m['timestamp'] ?? '' ) ) ?: 0 ];
		if ( count( $items ) >= 12 ) break;
	}
	foreach ( (array) glob( "$dir/*.jpg" ) as $f ) {   // pictures of posts no longer in the list
		if ( ! in_array( basename( $f ), array_column( $items, 'file' ), true ) ) @unlink( $f );
	}
	$ig['items'] = $items;
	$ig['fetched'] = time();
	$ig['error'] = '';
	slim_ig_save( $ig );
	return '';
}

/** Swaps the token for a fresh 60-day one. Instagram refuses tokens under 24 hours old, so this runs weekly. */
function slim_ig_refresh(): string {
	$ig = slim_ig();
	if ( $ig['token'] === '' ) return 'No access token.';
	$res = slim_ig_get( '/refresh_access_token', [ 'grant_type' => 'ig_refresh_token', 'access_token' => $ig['token'] ] );
	if ( is_wp_error( $res ) || empty( $res['access_token'] ) ) {
		$ig['error'] = is_wp_error( $res ) ? $res->get_error_message() : 'Instagram sent no new token.';
		slim_ig_save( $ig );
		return $ig['error'];
	}
	$ig['token'] = (string) $res['access_token'];
	$ig['expires'] = time() + (int) ( $res['expires_in'] ?? 0 );
	$ig['refreshed'] = time();
	slim_ig_save( $ig );
	return '';
}

/** Checks a new token and reads the account name for the Follow link. */
function slim_ig_connect( string $token ): string {
	$ig = slim_ig();
	$ig['token'] = $token;
	$me = slim_ig_get( '/me', [ 'fields' => 'username', 'access_token' => $token ] );
	if ( is_wp_error( $me ) ) return $me->get_error_message();
	$ig['user'] = preg_replace( '/[^\w.]/', '', (string) ( $me['username'] ?? '' ) );
	$ig['refreshed'] = time();
	$ig['expires'] = time() + 60 * DAY_IN_SECONDS;
	slim_ig_save( $ig );
	return slim_ig_fetch();
}

add_action( 'init', function () {
	if ( ! wp_next_scheduled( 'slim_ig_fetch' ) ) wp_schedule_event( time() + 300, 'hourly', 'slim_ig_fetch' );
	if ( ! wp_next_scheduled( 'slim_ig_refresh' ) ) wp_schedule_event( time() + DAY_IN_SECONDS, 'weekly', 'slim_ig_refresh' );
} );
add_action( 'slim_ig_fetch', function () { if ( slim_ig()['token'] !== '' ) slim_ig_fetch(); } );
add_action( 'slim_ig_refresh', function () { if ( slim_ig()['token'] !== '' ) slim_ig_refresh(); } );
add_action( 'switch_theme', function () { wp_clear_scheduled_hook( 'slim_ig_fetch' ); wp_clear_scheduled_hook( 'slim_ig_refresh' ); } );

/** The home page section. Nothing is printed until there are posts. */
function slim_ig_section(): void {
	$ig = slim_ig();
	$items = array_slice( (array) $ig['items'], 0, max( 3, min( 12, (int) $ig['show'] ) ) );
	[ $dir, $url ] = slim_ig_dir();
	$items = array_filter( $items, fn( $i ) => is_file( $dir . '/' . $i['file'] ) );
	if ( ! $items ) return;
	$user = (string) $ig['user'];
	echo "\n" . '<section class="sec ig" id="instagram" aria-labelledby="h-ig">' . "\n  <div class=\"wrap\">\n    <div class=\"sec-head\">\n";
	echo '      <h2 id="h-ig">' . slim_t( $ig['title'] ) . "</h2>\n";
	if ( $user !== '' ) echo '      <p><a href="' . esc_url( "https://www.instagram.com/$user/" ) . '" target="_blank" rel="noopener">Follow @' . slim_t( $user ) . "</a></p>\n";
	echo "    </div>\n    <ul class=\"ig-grid\">\n";
	foreach ( $items as $i ) {
		echo '      <li><a href="' . esc_url( $i['link'] ) . '" target="_blank" rel="noopener"><img src="' . esc_url( "$url/{$i['file']}" ) . '" alt="' . esc_attr( $i['alt'] !== '' ? $i['alt'] : 'Instagram post' ) . '" loading="lazy" width="' . (int) ( $i['px'] ?? 640 ) . '" height="' . (int) ( $i['px'] ?? 640 ) . '" decoding="async"></a></li>' . "\n";
	}
	echo "    </ul>\n  </div>\n</section>\n";
}

/* Apex Slim › Instagram */
add_action( 'admin_menu', function () {
	add_submenu_page( 'slim-settings', 'Instagram', 'Instagram', 'manage_options', 'slim-instagram', 'slim_ig_page' );
} );

function slim_ig_page(): void {
	if ( ! current_user_can( 'manage_options' ) ) return;
	$msg = '';
	if ( isset( $_POST['slim_ig_nonce'] ) && wp_verify_nonce( sanitize_key( $_POST['slim_ig_nonce'] ), 'slim_ig' ) ) {
		$ig = slim_ig();
		$ig['title'] = sanitize_text_field( wp_unslash( $_POST['slim_ig_title'] ?? '' ) ) ?: 'On Instagram';
		$ig['show'] = max( 3, min( 12, (int) ( $_POST['slim_ig_show'] ?? 6 ) ) );
		slim_ig_save( $ig );
		$token = preg_replace( '/[^\w-]/', '', (string) wp_unslash( $_POST['slim_ig_token'] ?? '' ) );
		if ( ! empty( $_POST['slim_ig_remove'] ) ) {
			slim_ig_save( [ 'title' => $ig['title'], 'show' => $ig['show'] ] );
			[ $dir ] = slim_ig_dir();
			foreach ( (array) glob( "$dir/*.jpg" ) as $f ) @unlink( $f );
			$msg = 'The token and the saved posts are removed. The feed is hidden.';
			slim_audit( 'settings', 0, 'Instagram: token removed' );
		} elseif ( $token !== '' ) {
			$e = slim_ig_connect( $token );
			$msg = $e === '' ? 'Connected and fetched.' : 'Instagram said: ' . $e;
			slim_audit( 'settings', 0, 'Instagram: new token' );
		} elseif ( isset( $_POST['slim_ig_fetch'] ) ) {
			$e = slim_ig_fetch();
			$msg = $e === '' ? 'Fetched.' : 'Instagram said: ' . $e;
		} else {
			$msg = 'Saved.';
		}
	}
	$ig = slim_ig();
	$when = fn( $t ) => $t ? wp_date( 'j M Y, H:i', (int) $t ) : 'never';
	echo '<div class="wrap"><h1>Instagram</h1>';
	if ( $msg ) echo '<div class="notice notice-info"><p>' . esc_html( $msg ) . '</p></div>';
	echo '<p>The home page shows the latest posts of one Instagram account. The site fetches them every hour and keeps its own copy of each picture, so visitors never load anything from Instagram. The section stays hidden until the first fetch works.</p>';
	echo '<form method="post"><table class="form-table">';
	echo '<tr><th><label for="slim-ig-token">Access token</label></th><td><input id="slim-ig-token" name="slim_ig_token" type="password" class="regular-text" autocomplete="off" value="">';
	echo '<p class="description">' . ( $ig['token'] !== '' ? 'A token is saved. Paste a new one only to replace it.' : 'From the Meta app for Apex\'s Instagram professional account: Instagram › API setup with Instagram login › Generate token. It starts with IG.' ) . '</p>';
	if ( $ig['token'] !== '' ) echo '<label><input type="checkbox" name="slim_ig_remove" value="1"> Remove the token and hide the feed</label>';
	echo '</td></tr>';
	echo '<tr><th><label for="slim-ig-title">Heading</label></th><td><input id="slim-ig-title" name="slim_ig_title" class="regular-text" value="' . esc_attr( $ig['title'] ) . '"></td></tr>';
	echo '<tr><th><label for="slim-ig-show">Posts to show</label></th><td><input id="slim-ig-show" name="slim_ig_show" type="number" min="3" max="12" value="' . (int) $ig['show'] . '"><p class="description">6 fills one row on a computer.</p></td></tr>';
	echo '</table>';
	wp_nonce_field( 'slim_ig', 'slim_ig_nonce' );
	echo '<p class="submit"><button class="button button-primary">Save</button> ';
	if ( $ig['token'] !== '' ) echo '<button class="button" name="slim_ig_fetch" value="1">Fetch now</button>';
	echo '</p></form>';
	if ( $ig['token'] !== '' ) {
		echo '<h2>Status</h2><table class="widefat striped" style="max-width:640px"><tbody>';
		$rows = [
			'Account' => $ig['user'] !== '' ? '@' . $ig['user'] : 'unknown',
			'Last fetch that worked' => $when( $ig['fetched'] ?? 0 ),
			'Posts saved' => (string) count( (array) $ig['items'] ),
			'Token renewed' => $when( $ig['refreshed'] ?? 0 ) . ', every week by itself',
			'Token runs out' => $when( $ig['expires'] ?? 0 ) . ' if it stops being renewed',
			'Last error' => $ig['error'] !== '' ? $ig['error'] : 'none',
		];
		foreach ( $rows as $k => $v ) echo '<tr><th style="width:200px">' . esc_html( $k ) . '</th><td>' . esc_html( $v ) . '</td></tr>';
		echo '</tbody></table>';
	}
	echo '</div>';
}

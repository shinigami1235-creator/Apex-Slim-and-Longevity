<?php
/**
 * Content import, export and check.
 *
 * content.json holds every editable text and picture of the site in one file: settings, the home and lab
 * pages, the treatments and the Results cases. The theme ships with one (made by tools/export_content.py from
 * the design), so a new install gets the whole site from Tools › Apex Slim content › Import.
 *
 * Import matches treatments and cases by their address (key), so running it again updates them in place.
 * It never touches the privacy policy text once the page exists, and never deletes anything.
 */
defined( 'ABSPATH' ) || exit;

/** Cleans one block of content against its schema, the same way the admin forms do. */
function slim_clean_all( string $schema, array $in ): array {
	$o = [];
	foreach ( slim_schema( $schema ) as $f ) {
		if ( ! empty( $f['src'] ) || $f['t'] === 'content' || ! array_key_exists( $f['k'], $in ) ) continue;
		$o[ $f['k'] ] = slim_clean( $f, $in[ $f['k'] ] );
	}
	return $o;
}

/** The fixed page for $k, made when missing. */
function slim_ensure_page( string $k, string $title ): int {
	$id = slim_page_id( $k );
	if ( $id ) return $id;
	$slug = slim_page_types()[ $k ][1];
	$id = (int) wp_insert_post( [ 'post_type' => 'page', 'post_status' => 'publish', 'post_title' => $title, 'post_name' => $slug, 'meta_input' => [ '_slim_page' => $k ] ] );
	return $id;
}

function slim_find( string $type, string $key ): int {
	$q = get_posts( [ 'post_type' => $type, 'name' => $key, 'post_status' => [ 'publish', 'draft', 'private', 'pending' ], 'numberposts' => 1, 'fields' => 'ids', 'no_found_rows' => true ] );
	return (int) ( $q[0] ?? 0 );
}

/** Imports content.json data. Returns lines describing what happened. */
function slim_import( array $d ): array {
	$log = [];
	if ( ( $d['version'] ?? 0 ) !== 1 ) return [ 'This file is not Apex Slim content (version 1).' ];
	kses_remove_filters();   // the article HTML keeps its figures and boxes; only administrators can import
	if ( isset( $d['settings'] ) ) {
		$old = get_option( 'slim_settings' );
		update_option( 'slim_settings', array_merge( is_array( $old ) ? $old : [], slim_clean_all( 'settings', (array) $d['settings'] ) ), true );
		$log[] = 'Settings';
	}
	if ( isset( $d['home'] ) ) {
		$id = slim_ensure_page( 'home', 'Home' );
		slim_write_post( $id, 'page:home', slim_clean_all( 'page:home', (array) $d['home'] ) );
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $id );
		$log[] = 'Home page';
	}
	if ( isset( $d['lab'] ) ) {
		$id = slim_ensure_page( 'lab', (string) ( $d['lab']['h1'] ?? 'Slim Wellness Lab' ) );
		slim_write_post( $id, 'page:lab', slim_clean_all( 'page:lab', (array) $d['lab'] ) );
		$log[] = 'Lab page, ' . count( (array) ( $d['lab']['meals'] ?? [] ) ) . ' meals';
	}
	if ( ! slim_page_id( 'privacy' ) ) {
		$pid = (int) get_option( 'wp_page_for_privacy_policy' );
		$text = (string) file_get_contents( SLIM_DIR . '/parts/privacy.html' );
		if ( $pid && get_post_status( $pid ) && get_post_field( 'post_name', $pid ) === 'privacy-policy' ) wp_delete_post( $pid, true );   // WordPress's sample policy, so the address is free
		$id = (int) wp_insert_post( [ 'post_type' => 'page', 'post_status' => 'publish', 'post_title' => 'Privacy policy', 'post_name' => 'privacy-policy', 'post_content' => $text, 'meta_input' => [ '_slim_page' => 'privacy' ] ] );
		update_option( 'wp_page_for_privacy_policy', $id );
		$log[] = 'Privacy policy page (Apex Medical Center\'s policy)';
	}
	foreach ( (array) ( $d['treatments'] ?? [] ) as $i => $t ) {
		$key = sanitize_title( (string) ( $t['key'] ?? '' ) );
		if ( $key === '' ) continue;
		if ( ! isset( $t['icon'] ) && isset( SLIM_ICONS[ $t['sym'] ?? '' ] ) ) $t['icon'] = $t['sym'];
		$id = slim_find( 'slim_treatment', $key );
		$post = [ 'ID' => $id, 'post_type' => 'slim_treatment', 'post_status' => 'publish', 'post_title' => slim_plain( (string) ( $t['name'] ?? $key ) ), 'post_name' => $key, 'menu_order' => (int) ( $t['order'] ?? $i ), 'post_content' => (string) ( $t['body'] ?? '' ) ];
		$id = (int) wp_insert_post( $post );
		slim_write_post( $id, 'slim_treatment', slim_clean_all( 'slim_treatment', $t ) );
	}
	if ( ! empty( $d['treatments'] ) ) $log[] = count( $d['treatments'] ) . ' treatments';
	foreach ( (array) ( $d['cases'] ?? [] ) as $i => $c ) {
		$key = sanitize_title( (string) ( $c['key'] ?? '' ) );
		if ( $key === '' ) continue;
		if ( isset( $c['raw'] ) && array_is_list( (array) $c['raw'] ) ) $c['raw'] = [ 'before' => $c['raw'][0] ?? '', 'after' => $c['raw'][1] ?? '' ];
		$id = slim_find( 'slim_case', $key );
		$id = (int) wp_insert_post( [ 'ID' => $id, 'post_type' => 'slim_case', 'post_status' => 'publish', 'post_title' => slim_plain( (string) ( $c['title'] ?? $key ) ), 'post_name' => $key, 'menu_order' => (int) ( $c['order'] ?? $i ) ] );
		slim_write_post( $id, 'slim_case', slim_clean_all( 'slim_case', $c ) );
		slim_case_pods( $id );
	}
	if ( ! empty( $d['cases'] ) ) $log[] = count( $d['cases'] ) . ' Results cases';
	kses_init_filters();
	flush_rewrite_rules( false );
	slim_data_bump();
	slim_audit( 'import', 0, implode( ', ', $log ) );
	return $log;
}

/** Everything as content.json data, the same shape the import reads. */
function slim_export(): array {
	$strip = function ( array $v, string $schema ): array {
		foreach ( slim_schema( $schema ) as $f ) if ( ! empty( $f['src'] ) && ! in_array( $f['src'], [ 'title', 'slug', 'order' ], true ) ) unset( $v[ $f['k'] ] );
		unset( $v['id'], $v['url'], $v['status'] );
		return $v;
	};
	return [
		'version' => 1,
		'exported' => gmdate( 'c' ),
		'settings' => slim_settings(),
		'home' => slim_page_vals( 'home' ),
		'lab' => slim_page_vals( 'lab' ),
		'treatments' => array_map( fn( $t ) => $strip( $t, 'slim_treatment' ), slim_treatments( true ) ),
		'cases' => array_map( function ( $p ) { $v = slim_read_post( $p, 'slim_case' ); return $v; }, get_posts( [ 'post_type' => 'slim_case', 'post_status' => [ 'publish', 'draft', 'private' ], 'numberposts' => 100, 'orderby' => 'menu_order', 'order' => 'ASC' ] ) ),
	];
}

/** Problems a person should fix before launch: [ 'error'|'warn', message ]. */
function slim_check(): array {
	$out = [];
	$err = function ( $m ) use ( &$out ) { $out[] = [ 'error', $m ]; };
	$warn = function ( $m ) use ( &$out ) { $out[] = [ 'warn', $m ]; };
	$pics = function ( $v, string $where ) use ( &$pics, $err ) {
		if ( is_array( $v ) ) { foreach ( $v as $x ) $pics( $x, $where ); return; }
		if ( ! is_string( $v ) || ! preg_match( '#^(img|video|lab)/|^~/wp-content/#', $v ) ) return;
		$f = slim_img_file( $v );
		if ( $f && ! is_file( $f ) ) $err( "$where: the picture $v is missing" );
	};
	if ( ! slim_page_id( 'home' ) ) $err( 'There is no home page. Import the content.' );
	elseif ( (int) get_option( 'page_on_front' ) !== slim_page_id( 'home' ) || get_option( 'show_on_front' ) !== 'page' ) $err( 'Settings › Reading does not show the Home page as the front page.' );
	if ( ! slim_page_id( 'lab' ) ) $err( 'There is no Slim Wellness Lab page.' );
	if ( get_option( 'permalink_structure' ) === '' ) $err( 'Settings › Permalinks is set to Plain. Choose "Post name".' );
	if ( ! slim_privacy_url() ) $err( 'The privacy policy page is not published. Apex checks the text, then publishes it.' );
	if ( ! get_option( 'blog_public' ) ) $warn( 'Settings › Reading asks search engines not to index the site. Right for staging, wrong for the live site.' );
	$s = slim_settings();
	if ( empty( $s['notify'] ) ) $warn( 'Apex Slim › Settings has no address for new requests, so they go to ' . get_option( 'admin_email' ) . '.' );
	if ( empty( $s['consult']['consent'] ) ) $err( 'The consult form has no consent line.' );
	if ( empty( $s['permit'] ) ) $warn( 'No advertising permit number yet (Apex Slim › Settings).' );
	$pics( $s, 'Settings' );
	$syms = [];
	$keys = array_column( slim_treatments( true ), 'key' );
	foreach ( slim_treatments( true ) as $t ) {
		$w = 'Treatment ' . $t['name'];
		foreach ( [ 'sym' => 'symbol', 'goal' => 'goal', 'desc' => 'search description' ] as $k => $x ) if ( empty( $t[ $k ] ) ) $err( "$w has no $x" );
		if ( empty( $t['note']['h'] ) ) $warn( "$w has no Lab Notes card" );
		if ( isset( $syms[ $t['sym'] ] ) ) $err( "$w has the same symbol as " . $syms[ $t['sym'] ] );
		$syms[ $t['sym'] ] = $t['name'];
		if ( ! empty( $t['pair']['to'] ) && ! in_array( $t['pair']['to'], $keys, true ) ) $err( "$w pairs with " . $t['pair']['to'] . ', which is not a treatment' );
		if ( $t['group'] === 'longevity' && empty( $t['longCard'] ) ) $warn( "$w has no Longevity card text" );
		$pics( $t, $w );
	}
	foreach ( get_posts( [ 'post_type' => 'slim_case', 'post_status' => 'publish', 'numberposts' => 100 ] ) as $p ) {
		$c = slim_read_post( $p, 'slim_case' );
		$w = 'Results case ' . $c['title'];
		if ( count( (array) $c['pod'] ) < 2 ) $err( "$w has no pod pictures. Save it again after choosing both photos." );
		foreach ( (array) $c['tx'] as $sym ) if ( ! isset( $syms[ $sym ] ) ) $err( "$w names $sym, which is not a treatment symbol" );
		if ( ! $c['tx'] ) $err( "$w has no treatment ticked" );
		$pics( $c, $w );
	}
	$lab = slim_page_vals( 'lab' );
	foreach ( (array) ( $lab['meals'] ?? [] ) as $m ) if ( empty( $m['dishes'] ) ) $warn( 'The ' . $m['meal'] . ' meal has no dishes' );
	$pics( slim_page_vals( 'home' ), 'Home page' );
	return $out;
}

/* ---------- Tools › Apex Slim content ---------- */
add_action( 'admin_menu', function () {
	add_management_page( 'Apex Slim content', 'Apex Slim content', 'manage_options', 'slim-content', 'slim_content_page' );
} );
add_action( 'admin_post_slim_export', function () {
	if ( ! current_user_can( 'manage_options' ) || ! check_admin_referer( 'slim_export' ) ) wp_die( 'Not allowed.' );
	nocache_headers();
	header( 'Content-Type: application/json; charset=utf-8' );
	header( 'Content-Disposition: attachment; filename="apex-slim-content-' . gmdate( 'Y-m-d' ) . '.json"' );
	echo wp_json_encode( slim_export(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES );
	exit;
} );
function slim_content_page(): void {
	if ( ! current_user_can( 'manage_options' ) ) return;
	echo '<div class="wrap"><h1>Apex Slim content</h1>';
	if ( isset( $_POST['slim_import_nonce'] ) && wp_verify_nonce( sanitize_key( $_POST['slim_import_nonce'] ), 'slim_import' ) ) {
		$json = '';
		if ( ! empty( $_POST['slim_bundled'] ) ) $json = (string) file_get_contents( SLIM_DIR . '/content.json' );
		elseif ( ! empty( $_FILES['slim_file']['tmp_name'] ) && is_uploaded_file( $_FILES['slim_file']['tmp_name'] ) ) $json = (string) file_get_contents( $_FILES['slim_file']['tmp_name'] );
		$d = json_decode( $json, true );
		$log = is_array( $d ) ? slim_import( $d ) : [ 'That file could not be read as JSON.' ];
		echo '<div class="notice notice-success"><p><b>Imported:</b> ' . esc_html( implode( ', ', $log ) ) . '</p></div>';
	}
	$problems = slim_check();
	echo '<h2>Check</h2>';
	if ( ! $problems ) echo '<p>Nothing to fix.</p>';
	else {
		echo '<table class="widefat striped" style="max-width:900px"><tbody>';
		foreach ( $problems as [ $lvl, $m ] ) echo '<tr><td style="width:70px"><b style="color:' . ( $lvl === 'error' ? '#b32d2e' : '#996800' ) . '">' . ( $lvl === 'error' ? 'Fix' : 'Note' ) . '</b></td><td>' . esc_html( $m ) . '</td></tr>';
		echo '</tbody></table>';
	}
	echo '<h2>Export</h2><p>Every text and picture address of the site in one file. Keep one before a big change; importing it puts the content back.</p>';
	echo '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '"><input type="hidden" name="action" value="slim_export">';
	wp_nonce_field( 'slim_export' );
	submit_button( 'Download content.json', 'secondary', '', false );
	echo '</form><h2>Import</h2><p>Updates the settings, the home and lab pages, and each treatment and Results case with the same address. Content not in the file stays as it is.</p>';
	echo '<form method="post" enctype="multipart/form-data">';
	wp_nonce_field( 'slim_import', 'slim_import_nonce' );
	echo '<p><input type="file" name="slim_file" accept=".json,application/json"> ';
	submit_button( 'Import this file', 'primary', '', false );
	echo '</p><p>';
	if ( is_file( SLIM_DIR . '/content.json' ) ) submit_button( 'Import the content that came with the theme', 'secondary', 'slim_bundled', false, [ 'onclick' => "return confirm('This replaces the text of the home and lab pages, the settings, and every treatment and case that came with the theme. Continue?')" ] );
	echo '</p></form></div>';
}

<?php
/**
 * The admin forms, built from inc/schema.php: a "Page content" box on the home, lab and privacy pages, a
 * "Details" box on every treatment and Results case, and Apex Slim › Settings.
 */
defined( 'ABSPATH' ) || exit;

/* the home and lab pages have no editor: their content is the form */
function slim_page_has_body( WP_Post $post ): bool {
	foreach ( slim_schema( 'page:' . get_post_meta( $post->ID, '_slim_page', true ) ) as $f ) if ( $f['t'] === 'content' ) return true;
	return false;
}
add_filter( 'use_block_editor_for_post', function ( $use, $post ) {
	if ( $post && $post->post_type === 'page' && get_post_meta( $post->ID, '_slim_page', true ) !== '' && ! slim_page_has_body( $post ) ) return false;
	return $use;
}, 10, 2 );
add_action( 'add_meta_boxes_page', function ( $post ) {
	if ( get_post_meta( $post->ID, '_slim_page', true ) === '' || slim_page_has_body( $post ) ) return;
	foreach ( [ 'editor', 'thumbnail', 'custom-fields', 'comments' ] as $s ) remove_post_type_support( 'page', $s );
} );

add_action( 'add_meta_boxes', function ( $type, $post ) {
	if ( ! $post instanceof WP_Post ) return;
	$schema = slim_schema_for( $post );
	if ( ! $schema || $schema === 'page:privacy' ) return;
	add_meta_box( 'slim-fields', $post->post_type === 'page' ? __( 'Page content', 'slim' ) : __( 'Details', 'slim' ), 'slim_fields_box', null, 'normal', 'high', [ 'schema' => $schema, '__back_compat_meta_box' => false ] );
}, 10, 2 );

function slim_fields_box( WP_Post $post, array $box ): void {
	$schema = $box['args']['schema'];
	$vals = slim_read_post( $post, $schema );
	wp_nonce_field( 'slim_fields_' . $post->ID, 'slim_fields_nonce' );
	echo '<div class="slim-fields">';
	if ( $post->post_type === 'page' ) {
		$label = slim_page_types()[ substr( $schema, 5 ) ][0] ?? '';
		echo '<p class="slim-note">' . sprintf( esc_html__( 'This is the %s page. Its layout is fixed; fill in the text here. Treatments, Results cases and the footer have their own screens on the left.', 'slim' ), '<b>' . esc_html( $label ) . '</b>' ) . '</p>';
	}
	foreach ( slim_schema( $schema ) as $f ) {
		if ( ! empty( $f['src'] ) || ! empty( $f['hidden'] ) ) continue;
		if ( $f['t'] === 'content' ) {
			echo '<div class="slim-field slim-in-editor"><label>' . esc_html( $f['l'] ) . '</label><p class="description">' . esc_html( $f['h'] ?? '' ) . '</p></div>';
			continue;
		}
		slim_field_html( $f, $vals[ $f['k'] ] ?? null, 'slim[' . $f['k'] . ']' );
	}
	if ( $post->post_type === 'slim_case' && ! empty( $vals['pod'] ) ) {
		echo '<div class="slim-field"><label>' . esc_html__( 'Pod pictures cut from the photos', 'slim' ) . '</label><p>';
		foreach ( (array) $vals['pod'] as $s ) echo '<img src="' . esc_url( slim_img( $s ) ) . '" alt="" style="height:120px;margin-right:8px;border:1px solid #dcdcde;border-radius:4px">';
		echo '</p></div>';
	}
	echo '</div>';
}

function slim_options( array $f ): array {
	return is_string( $f['o'] ?? null ) && is_callable( $f['o'] ) ? call_user_func( $f['o'] ) : (array) ( $f['o'] ?? [] );
}

/* ---------- one field ---------- */
function slim_field_html( array $f, $v, string $name ): void {
	$id = 'slm-' . substr( md5( $name ), 0, 10 );
	$help = ! empty( $f['h'] ) ? '<p class="description">' . esc_html( $f['h'] ) . '</p>' : '';
	$label = '<label for="' . $id . '">' . esc_html( $f['l'] ) . '</label>';
	$t = $f['t'];
	echo '<div class="slim-field slim-t-' . esc_attr( $t ) . '">';
	switch ( $t ) {
		case 'text': case 'url':
			echo $label . '<input type="text" class="widefat" id="' . $id . '" name="' . esc_attr( $name ) . '" value="' . esc_attr( (string) $v ) . '"' . ( $t === 'url' ? ' inputmode="url" spellcheck="false"' : '' ) . '>' . $help;
			break;
		case 'number':
			echo $label . '<input type="number" step="any" class="small-text" id="' . $id . '" name="' . esc_attr( $name ) . '" value="' . esc_attr( $v === null ? '' : (string) $v ) . '">' . $help;
			break;
		case 'textarea': case 'html':
			echo $label . '<textarea class="widefat" rows="3" id="' . $id . '" name="' . esc_attr( $name ) . '">' . esc_textarea( (string) $v ) . '</textarea>' . $help;
			break;
		case 'lines': case 'hlines':
			echo $label . '<textarea class="widefat" rows="' . max( 3, min( 14, count( (array) $v ) + 1 ) ) . '" id="' . $id . '" name="' . esc_attr( $name ) . '">' . esc_textarea( implode( "\n", (array) $v ) ) . '</textarea>' . $help;
			break;
		case 'scalars':
			echo $label . '<textarea class="widefat slim-scalars" rows="' . max( 2, min( 8, count( (array) $v ) + 1 ) ) . '" id="' . $id . '" name="' . esc_attr( $name ) . '" spellcheck="false">' . esc_textarea( implode( "\n", (array) $v ) ) . '</textarea>'
				. '<p><button type="button" class="button slim-media-add" data-for="' . $id . '" data-type="image">' . esc_html__( 'Add pictures', 'slim' ) . '</button></p>'
				. ( $help ?: '<p class="description">' . esc_html__( 'One per line, in the order they show.', 'slim' ) . '</p>' );
			break;
		case 'image':
			$src = slim_img( (string) $v );
			echo $label . '<div class="slim-image"><span class="slim-thumb">' . ( $src ? '<img src="' . esc_url( $src ) . '" alt="">' : '' ) . '</span><input type="text" class="widefat" id="' . $id . '" name="' . esc_attr( $name ) . '" value="' . esc_attr( (string) $v ) . '" spellcheck="false"><button type="button" class="button slim-media" data-for="' . $id . '">' . esc_html__( 'Choose', 'slim' ) . '</button></div>' . $help;
			break;
		case 'bool':
			echo '<label class="slim-check"><input type="hidden" name="' . esc_attr( $name ) . '" value="0"><input type="checkbox" id="' . $id . '" name="' . esc_attr( $name ) . '" value="1"' . checked( (bool) $v, true, false ) . '> ' . esc_html( $f['l'] ) . '</label>' . $help;
			break;
		case 'select':
			$o = slim_options( $f );
			echo $label . '<select id="' . $id . '" name="' . esc_attr( $name ) . '">';
			// a saved value that is not in the list stays selected, so saving the screen does not change it
			if ( (string) $v !== '' && ! array_key_exists( (string) $v, $o ) ) echo '<option value="' . esc_attr( (string) $v ) . '" selected>' . esc_html( (string) $v ) . '</option>';
			foreach ( $o as $k => $x ) echo '<option value="' . esc_attr( $k ) . '"' . selected( (string) $v, (string) $k, false ) . '>' . esc_html( $x ) . '</option>';
			echo '</select>' . $help;
			break;
		case 'txpick':
			echo '<label>' . esc_html( $f['l'] ) . '</label><input type="hidden" name="' . esc_attr( $name ) . '[]" value=""><div class="slim-txpick">';
			foreach ( slim_treatments() as $tx ) {
				echo '<label><input type="checkbox" name="' . esc_attr( $name ) . '[]" value="' . esc_attr( $tx['sym'] ) . '"' . checked( in_array( $tx['sym'], (array) $v, true ), true, false ) . '> <b>' . esc_html( $tx['sym'] ) . '</b> ' . esc_html( $tx['name'] ) . '</label>';
			}
			echo '</div>' . $help;
			break;
		case 'group':
			echo '<fieldset class="slim-group"><legend>' . esc_html( $f['l'] ) . '</legend>' . $help;
			foreach ( $f['f'] as $sf ) slim_field_html( $sf, is_array( $v ) ? ( $v[ $sf['k'] ] ?? null ) : null, $name . '[' . $sf['k'] . ']' );
			echo '</fieldset>';
			break;
		case 'repeater':
			$rows = is_array( $v ) ? array_values( $v ) : [];
			echo '<fieldset class="slim-group slim-repeater" data-name="' . esc_attr( $name ) . '" data-tpl="' . esc_attr( $name ) . '"><legend>' . esc_html( $f['l'] ) . '</legend>' . $help . '<ol class="slim-rows">';
			foreach ( $rows as $i => $row ) slim_row_html( $f, $row, $name . '[' . $i . ']' );
			echo '</ol><template class="slim-row-tpl">';
			slim_row_html( $f, [], $name . '[__i__]' );
			echo '</template><p><button type="button" class="button slim-add">' . esc_html__( 'Add', 'slim' ) . '</button></p></fieldset>';
			break;
	}
	echo '</div>';
}
function slim_row_html( array $f, $row, string $name ): void {
	echo '<li class="slim-row"><div class="slim-row-tools"><button type="button" class="button-link slim-up" aria-label="' . esc_attr__( 'Move up', 'slim' ) . '">↑</button><button type="button" class="button-link slim-down" aria-label="' . esc_attr__( 'Move down', 'slim' ) . '">↓</button><button type="button" class="button-link slim-del">' . esc_html__( 'Remove', 'slim' ) . '</button></div>';
	foreach ( $f['f'] as $sf ) slim_field_html( $sf, is_array( $row ) ? ( $row[ $sf['k'] ] ?? null ) : null, $name . '[' . $sf['k'] . ']' );
	echo '</li>';
}

/* ---------- cleaning what the form or an import sends ---------- */
function slim_clean_link( string $s ): string {
	$s = trim( $s );
	if ( $s === '' ) return '';
	if ( str_starts_with( $s, '~/' ) ) return '~/' . ltrim( preg_replace( '#[^\w\-./%~]#u', '', substr( $s, 2 ) ), '/' );
	if ( preg_match( '#^(img|video|lab)/#', $s ) ) return preg_replace( '#[^\w\-./]#', '', $s );   // a file in the theme
	return esc_url_raw( $s, [ 'http', 'https', 'tel', 'mailto' ] );
}
/** Plain text with tags removed, where a "<" or "&" the editor typed stays the character itself. */
function slim_plain( string $v, bool $multi = false ): string {
	$v = $multi ? sanitize_textarea_field( $v ) : sanitize_text_field( $v );
	return html_entity_decode( $v, ENT_QUOTES | ENT_HTML5, 'UTF-8' );
}
function slim_split( $v ): array {
	if ( is_array( $v ) ) return array_map( 'strval', array_filter( $v, 'is_scalar' ) );
	return preg_split( '/\r\n|\r|\n/', (string) $v );
}
function slim_clean( array $f, $v ) {
	switch ( $f['t'] ) {
		case 'text': return slim_plain( is_scalar( $v ) ? (string) $v : '' );
		case 'textarea': return slim_plain( is_scalar( $v ) ? (string) $v : '', true );
		case 'html': return trim( wp_kses_post( is_scalar( $v ) ? (string) $v : '' ) );
		case 'url': return slim_clean_link( is_scalar( $v ) ? (string) $v : '' );
		case 'image': return slim_img_store( slim_clean_link( is_scalar( $v ) ? (string) $v : '' ) );
		case 'number': $v = trim( is_scalar( $v ) ? (string) $v : '' ); return is_numeric( $v ) ? $v + 0 : '';
		case 'bool': return ! empty( $v ) && $v !== '0';
		case 'select': $o = slim_options( $f ); $v = is_scalar( $v ) ? (string) $v : ''; return array_key_exists( $v, $o ) ? $v : ( ! empty( $f['keep'] ) ? sanitize_title( $v ) : '' );
		case 'lines': return array_values( array_filter( array_map( fn( $x ) => slim_plain( $x ), slim_split( $v ) ), 'strlen' ) );
		case 'hlines': return array_values( array_filter( array_map( fn( $x ) => trim( wp_kses_post( $x ) ), slim_split( $v ) ), 'strlen' ) );
		case 'scalars': return array_values( array_filter( array_map( fn( $x ) => slim_img_store( slim_clean_link( $x ) ), slim_split( $v ) ), 'strlen' ) );
		case 'txpick': return array_values( array_unique( array_filter( array_map( fn( $x ) => preg_replace( '/[^A-Za-z0-9]/', '', (string) $x ), (array) $v ), 'strlen' ) ) );
		case 'group':
			$o = [];
			foreach ( $f['f'] as $sf ) $o[ $sf['k'] ] = slim_clean( $sf, is_array( $v ) ? ( $v[ $sf['k'] ] ?? '' ) : '' );
			return $o;
		case 'repeater':
			$rows = [];
			foreach ( is_array( $v ) ? $v : [] as $k => $row ) {
				if ( $k === '__i__' || ! is_array( $row ) ) continue;
				$r = slim_clean( [ 't' => 'group', 'f' => $f['f'] ], $row );
				if ( array_filter( $r, fn( $x ) => $x !== '' && $x !== [] && $x !== false ) ) $rows[] = $r;
			}
			return $rows;
	}
	return '';
}

add_action( 'save_post', function ( $id, $post ) {
	if ( ! isset( $_POST['slim_fields_nonce'] ) || ! wp_verify_nonce( sanitize_key( $_POST['slim_fields_nonce'] ), 'slim_fields_' . $id ) ) return;
	if ( wp_is_post_autosave( $id ) || wp_is_post_revision( $id ) || ! current_user_can( 'edit_post', $id ) ) return;
	$schema = slim_schema_for( $post );
	if ( ! $schema ) return;
	$in = isset( $_POST['slim'] ) && is_array( $_POST['slim'] ) ? wp_unslash( $_POST['slim'] ) : [];
	$vals = [];
	foreach ( slim_schema( $schema ) as $f ) {
		if ( ! empty( $f['src'] ) || ! empty( $f['hidden'] ) || $f['t'] === 'content' ) continue;
		if ( ! array_key_exists( $f['k'], $in ) && $f['t'] !== 'repeater' ) continue;
		$vals[ $f['k'] ] = slim_clean( $f, $in[ $f['k'] ] ?? [] );
	}
	slim_write_post( $id, $schema, $vals );
	if ( $post->post_type === 'slim_case' ) slim_case_pods( $id );
	slim_data_bump();
}, 20, 2 );

/* ---------- Apex Slim › Settings ---------- */
function slim_settings_page(): void {
	if ( ! current_user_can( 'edit_pages' ) ) return;
	if ( isset( $_POST['slim_settings_nonce'] ) && wp_verify_nonce( sanitize_key( $_POST['slim_settings_nonce'] ), 'slim_settings' ) ) {
		$in = isset( $_POST['slim'] ) && is_array( $_POST['slim'] ) ? wp_unslash( $_POST['slim'] ) : [];
		$vals = [];
		foreach ( slim_schema( 'settings' ) as $f ) $vals[ $f['k'] ] = slim_clean( $f, $in[ $f['k'] ] ?? ( $f['t'] === 'repeater' ? [] : '' ) );
		$vals['notify'] = implode( ', ', array_filter( array_map( 'sanitize_email', explode( ',', (string) $vals['notify'] ) ) ) );
		update_option( 'slim_settings', $vals, true );
		slim_audit( 'settings', 0, 'Site settings' );
		slim_data_bump();
		echo '<div class="notice notice-success is-dismissible"><p>' . esc_html__( 'Saved.', 'slim' ) . '</p></div>';
	}
	$v = get_option( 'slim_settings' );
	$v = is_array( $v ) ? $v : [];
	echo '<div class="wrap slim-settings"><h1>' . esc_html__( 'Settings', 'slim' ) . '</h1><p>' . esc_html__( 'The logo, footer, LINE link and the consult form on every page, and where new requests go.', 'slim' ) . '</p>';
	echo '<form method="post" class="slim-fields">';
	wp_nonce_field( 'slim_settings', 'slim_settings_nonce' );
	foreach ( slim_schema( 'settings' ) as $f ) slim_field_html( $f, $v[ $f['k'] ] ?? null, 'slim[' . $f['k'] . ']' );
	submit_button();
	echo '</form></div>';
}

/* ---------- scripts for the forms ---------- */
add_action( 'admin_enqueue_scripts', function ( $hook ) {
	$on = in_array( $hook, [ 'post.php', 'post-new.php' ], true ) || str_contains( (string) $hook, 'slim-' );
	if ( ! $on ) return;
	wp_enqueue_media();
	wp_enqueue_style( 'slim-admin', SLIM_URI . '/admin/admin.css', [], SLIM_VERSION );
	wp_enqueue_script( 'slim-admin', SLIM_URI . '/admin/admin.js', [ 'jquery' ], SLIM_VERSION, true );
	wp_localize_script( 'slim-admin', 'SLIM_ADMIN', [ 'media' => slim_media_base(), 'home' => trailingslashit( home_url() ), 'theme' => SLIM_URI . '/assets/', 'choose' => __( 'Use this', 'slim' ) ] );
} );

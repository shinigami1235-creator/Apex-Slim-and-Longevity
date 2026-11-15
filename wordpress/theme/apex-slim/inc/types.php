<?php
/**
 * Content types: treatments (public pages at /treatments/<address>/), Results cases and enquiries (admin only),
 * and the fixed pages (home, lab, privacy policy), which are ordinary pages marked with _slim_page.
 *
 * Storage: the title, address, order and article are WordPress's own; every other field of the schema sits
 * in one post meta, _slim, as an array.
 */
defined( 'ABSPATH' ) || exit;

add_action( 'init', function () {
	register_post_type( 'slim_treatment', [
		'labels' => [ 'name' => 'Treatments', 'singular_name' => 'Treatment', 'add_new_item' => 'Add a treatment', 'edit_item' => 'Edit treatment', 'all_items' => 'Treatments', 'menu_name' => 'Treatments' ],
		'public' => true, 'has_archive' => false, 'show_in_rest' => false, 'menu_position' => 4, 'menu_icon' => 'dashicons-heart',
		'rewrite' => [ 'slug' => 'treatments', 'with_front' => false ],
		'supports' => [ 'title', 'editor', 'page-attributes', 'revisions' ],
		'capability_type' => 'page', 'map_meta_cap' => true,
	] );
	register_post_type( 'slim_case', [
		'labels' => [ 'name' => 'Results cases', 'singular_name' => 'Results case', 'add_new_item' => 'Add a case', 'edit_item' => 'Edit case', 'menu_name' => 'Results cases' ],
		'public' => false, 'show_ui' => true, 'show_in_rest' => false, 'menu_position' => 5, 'menu_icon' => 'dashicons-images-alt2',
		'supports' => [ 'title', 'page-attributes', 'revisions' ],
		'capability_type' => 'page', 'map_meta_cap' => true,
	] );
} );

/* the treatment article is HTML with figures and boxes: the classic editor keeps it as written */
add_filter( 'use_block_editor_for_post_type', fn( $use, $type ) => in_array( $type, [ 'slim_treatment', 'slim_case' ], true ) ? false : $use, 10, 2 );

/** Which schema an edit screen uses, or '' for none. */
function slim_schema_for( WP_Post $p ): string {
	if ( $p->post_type === 'page' ) {
		$k = (string) get_post_meta( $p->ID, '_slim_page', true );
		return $k !== '' && slim_schema( 'page:' . $k ) ? 'page:' . $k : '';
	}
	return in_array( $p->post_type, [ 'slim_treatment', 'slim_case' ], true ) ? $p->post_type : '';
}

/** Every field of a post as one array, keyed as in the schema. */
function slim_read_post( WP_Post $p, string $schema = '' ): array {
	$schema = $schema ?: slim_schema_for( $p );
	$meta = get_post_meta( $p->ID, '_slim', true );
	$meta = is_array( $meta ) ? $meta : [];
	$o = [];
	foreach ( slim_schema( $schema ) as $f ) {
		$src = $f['src'] ?? ( $f['t'] === 'content' ? 'content' : '' );
		switch ( $src ) {
			case 'title': $o[ $f['k'] ] = $p->post_title; break;
			case 'slug': $o[ $f['k'] ] = $p->post_name; break;
			case 'order': $o[ $f['k'] ] = (int) $p->menu_order; break;
			case 'content': $o[ $f['k'] ] = $p->post_content; break;
			default: $o[ $f['k'] ] = $meta[ $f['k'] ] ?? null;
		}
	}
	return $o;
}
/** Saves the schema fields that are not WordPress's own boxes. Fields not in $vals keep their value. */
function slim_write_post( int $id, string $schema, array $vals ): void {
	$meta = get_post_meta( $id, '_slim', true );
	$meta = is_array( $meta ) ? $meta : [];
	foreach ( slim_schema( $schema ) as $f ) {
		if ( ! empty( $f['src'] ) || $f['t'] === 'content' || ! array_key_exists( $f['k'], $vals ) ) continue;
		$meta[ $f['k'] ] = $vals[ $f['k'] ];
	}
	update_post_meta( $id, '_slim', wp_slash( $meta ) );
}

/* the fixed pages cannot be deleted by accident: the site needs them */
add_action( 'wp_trash_post', function ( $id ) {
	if ( get_post_type( $id ) === 'page' && get_post_meta( $id, '_slim_page', true ) !== '' && ! ( defined( 'WP_CLI' ) && WP_CLI ) ) {
		wp_die( esc_html__( 'The site needs this page. Change its content instead of deleting it.', 'slim' ), '', [ 'back_link' => true ] );
	}
} );

<?php
/**
 * The admin: the Apex Slim menu, list columns, a dashboard box, and what this site does not use (posts, comments).
 */
defined( 'ABSPATH' ) || exit;

add_action( 'admin_menu', function () {
	add_menu_page( 'Apex Slim', 'Apex Slim', 'edit_pages', 'slim-settings', 'slim_settings_page', 'dashicons-admin-site-alt3', 2 );
	add_submenu_page( 'slim-settings', 'Settings', 'Settings', 'edit_pages', 'slim-settings', 'slim_settings_page' );
	foreach ( [ 'home' => 'Home page', 'lab' => 'Slim Wellness Lab page', 'privacy' => 'Privacy policy page' ] as $k => $label ) {
		if ( $id = slim_page_id( $k ) ) add_submenu_page( 'slim-settings', $label, $label, 'edit_pages', 'post.php?post=' . $id . '&action=edit' );
	}
	add_submenu_page( 'slim-settings', 'Content check', 'Content check', 'manage_options', 'tools.php?page=slim-content' );
	remove_menu_page( 'edit.php' );   // the site has no blog
}, 9 );

/* treatments: symbol, section and order in the list */
add_filter( 'manage_slim_treatment_posts_columns', fn( $c ) => [ 'cb' => $c['cb'], 'title' => 'Treatment', 'slim_sym' => 'Symbol', 'slim_group' => 'Section', 'slim_order' => 'Order', 'date' => $c['date'] ] );
add_action( 'manage_slim_treatment_posts_custom_column', function ( $col, $id ) {
	$m = get_post_meta( $id, '_slim', true );
	if ( $col === 'slim_sym' ) echo esc_html( $m['sym'] ?? '' );
	if ( $col === 'slim_group' ) echo esc_html( ( $m['group'] ?? '' ) === 'longevity' ? 'Longevity' : 'Treatments' );
	if ( $col === 'slim_order' ) echo (int) get_post_field( 'menu_order', $id );
}, 10, 2 );
add_filter( 'manage_slim_case_posts_columns', fn( $c ) => [ 'cb' => $c['cb'], 'title' => 'Case', 'slim_pod' => 'Pod', 'slim_order' => 'Order', 'date' => $c['date'] ] );
add_action( 'manage_slim_case_posts_custom_column', function ( $col, $id ) {
	$m = get_post_meta( $id, '_slim', true );
	if ( $col === 'slim_pod' ) foreach ( array_slice( (array) ( $m['pod'] ?? [] ), 0, 2 ) as $s ) echo '<img src="' . esc_url( slim_img( $s ) ) . '" alt="" style="height:48px;margin-right:4px">';
	if ( $col === 'slim_order' ) echo (int) get_post_field( 'menu_order', $id );
}, 10, 2 );
/* both lists in the order the site shows them */
add_action( 'pre_get_posts', function ( $q ) {
	if ( is_admin() && $q->is_main_query() && in_array( $q->get( 'post_type' ), [ 'slim_treatment', 'slim_case' ], true ) && ! $q->get( 'orderby' ) ) $q->set( 'orderby', [ 'menu_order' => 'ASC', 'title' => 'ASC' ] );
} );

/* Dashboard › Apex Slim */
add_action( 'wp_dashboard_setup', function () {
	wp_add_dashboard_widget( 'slim-dash', 'Apex Slim', function () {
		$n = current_user_can( 'edit_slim_leads' ) ? slim_new_leads() : 0;
		echo '<p>';
		if ( current_user_can( 'edit_slim_leads' ) ) echo '<a class="button button-primary" href="' . esc_url( admin_url( 'edit.php?post_type=slim_lead' ) ) . '">Enquiries' . ( $n ? " ($n new)" : '' ) . '</a> ';
		echo '<a class="button" href="' . esc_url( admin_url( 'edit.php?post_type=slim_treatment' ) ) . '">Treatments</a> ';
		echo '<a class="button" href="' . esc_url( admin_url( 'edit.php?post_type=slim_case' ) ) . '">Results cases</a> ';
		echo '<a class="button" href="' . esc_url( admin_url( 'admin.php?page=slim-settings' ) ) . '">Settings</a></p>';
		echo '<p>Each treatment is one page of the site. Its tile, Lab Notes card and mixing bench card are on the same screen. The home and lab page text is under Apex Slim on the left.</p>';
	} );
	remove_meta_box( 'dashboard_primary', 'dashboard', 'side' );
	remove_meta_box( 'dashboard_quick_press', 'dashboard', 'side' );
} );

/* the edit screen of a treatment links to the page it draws */
add_filter( 'post_type_labels_slim_treatment', function ( $l ) { $l->view_item = 'View page'; return $l; } );

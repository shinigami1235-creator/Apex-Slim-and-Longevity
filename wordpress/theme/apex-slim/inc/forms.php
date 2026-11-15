<?php
/**
 * The consult request form.
 *
 * The page script posts the form as JSON to /wp-json/slim/v1/consult. A request is checked, stored as a
 * private Enquiry (slim_lead) with the consent record, and emailed to the addresses in Apex Slim › Settings.
 * Enquiries older than the keep period are deleted every night.
 *
 * Spam: a hidden field people never fill in, a limit of 5 requests (and 30 tries) per connection per 10 minutes,
 * and requests only from pages on this site. Behind Cloudflare, set SLIM_IP_HEADER in wp-config.php (see HANDOVER.md).
 */
defined( 'ABSPATH' ) || exit;

const SLIM_LEAD_STATUS = [ 'new' => 'New', 'contacted' => 'Contacted', 'booked' => 'Booked', 'closed' => 'Closed' ];

add_action( 'init', function () {
	register_post_type( 'slim_lead', [
		'labels' => [ 'name' => 'Enquiries', 'singular_name' => 'Enquiry', 'edit_item' => 'Enquiry', 'all_items' => 'Enquiries', 'menu_name' => 'Enquiries', 'not_found' => 'No enquiries yet.' ],
		'public' => false, 'show_ui' => true, 'show_in_rest' => false, 'menu_position' => 3, 'menu_icon' => 'dashicons-email-alt',
		'supports' => [ 'title' ], 'capability_type' => [ 'slim_lead', 'slim_leads' ], 'map_meta_cap' => true,
		'capabilities' => [ 'create_posts' => 'do_not_allow' ],
	] );
} );

/* who may read enquiries: administrators and editors (Apex Slim staff). Reapplied when the theme version changes. */
add_action( 'admin_init', function () {
	if ( get_option( 'slim_caps_v' ) === SLIM_VERSION ) return;
	$caps = [ 'edit_slim_leads', 'edit_others_slim_leads', 'read_private_slim_leads', 'edit_private_slim_leads', 'delete_slim_leads', 'delete_others_slim_leads', 'delete_private_slim_leads', 'edit_published_slim_leads', 'delete_published_slim_leads', 'publish_slim_leads' ];
	foreach ( [ 'administrator', 'editor' ] as $r ) if ( $role = get_role( $r ) ) foreach ( $caps as $c ) $role->add_cap( $c );
	update_option( 'slim_caps_v', SLIM_VERSION, true );
} );

/* ---------- the endpoint ---------- */
add_action( 'rest_api_init', function () {
	register_rest_route( 'slim/v1', '/consult', [ 'methods' => 'POST', 'callback' => 'slim_consult_post', 'permission_callback' => '__return_true' ] );
} );

function slim_str( $v, int $max ): string { return is_scalar( $v ) ? mb_substr( trim( sanitize_text_field( (string) $v ) ), 0, $max ) : ''; }
function slim_rate_ok( string $what, int $max, int $window ): bool {
	$k = 'slim_rl_' . $what . '_' . slim_ip_hash();
	$n = (int) get_transient( $k );
	if ( $n >= $max ) return false;
	set_transient( $k, $n + 1, $window );
	return true;
}
/** The privacy policy version a visitor agrees to: the date it was last changed. */
function slim_policy_version(): string {
	$id = (int) get_option( 'wp_page_for_privacy_policy' );
	return $id ? (string) get_post_field( 'post_modified_gmt', $id ) : '';
}

function slim_consult_post( WP_REST_Request $req ) {
	$bad = fn( $msg, $code = 400 ) => new WP_Error( 'slim_form', $msg, [ 'status' => $code ] );
	// only from this site's own pages
	$origin = (string) $req->get_header( 'origin' );
	if ( $origin !== '' && wp_parse_url( $origin, PHP_URL_HOST ) !== wp_parse_url( home_url(), PHP_URL_HOST ) ) return $bad( 'The request did not go through.', 403 );
	$in = $req->get_json_params();
	if ( ! is_array( $in ) ) $in = $req->get_body_params();
	// the hidden field: a bot filled it, so pretend it worked and keep nothing
	if ( slim_str( $in['hp'] ?? '', 200 ) !== '' ) return [ 'ok' => true ];
	if ( ! slim_rate_ok( 'try', 30, 10 * MINUTE_IN_SECONDS ) ) return $bad( 'Too many tries from this connection. Wait a few minutes, or chat with us on LINE.', 429 );

	$name = slim_str( $in['name'] ?? '', 100 );
	$phone = slim_str( $in['phone'] ?? '', 30 );
	$line = slim_str( $in['line'] ?? '', 50 );
	$times = (array) ( slim_set( 'consult', [] )['times'] ?? [] );
	$time = slim_str( $in['time'] ?? '', 60 );
	$goals = array_values( array_intersect( array_keys( SLIM_GOALS ), array_map( 'strval', array_filter( (array) ( $in['goals'] ?? [] ), 'is_scalar' ) ) ) );
	$page = slim_str( $in['page'] ?? '', 200 );
	if ( $name === '' ) return $bad( 'Fill in your name.' );
	if ( $phone === '' && $line === '' ) return $bad( 'Fill in your phone number or LINE ID.' );
	if ( $phone !== '' && ! preg_match( '/^[0-9+\-\s().]{6,30}$/', $phone ) ) return $bad( 'Check the phone number.' );
	if ( empty( $in['consent'] ) || $in['consent'] === 'false' ) return $bad( 'Tick the box to agree to being contacted.' );
	if ( $times && ! in_array( $time, $times, true ) ) $time = '';
	// 5 requests per connection in 10 minutes; mistakes the form sends back do not count
	if ( ! slim_rate_ok( 'consult', 5, 10 * MINUTE_IN_SECONDS ) ) return $bad( 'Too many requests from this connection. Wait a few minutes, or chat with us on LINE.', 429 );

	$data = [
		'name' => $name, 'phone' => $phone, 'line' => $line, 'goals' => $goals, 'time' => $time, 'page' => $page,
		'status' => 'new', 'note' => '',
		'consent' => [ 'at' => gmdate( 'c' ), 'text' => (string) ( slim_set( 'consult', [] )['consent'] ?? '' ), 'policy' => slim_policy_version(), 'ip' => slim_ip_hash() ],
	];
	$id = wp_insert_post( [ 'post_type' => 'slim_lead', 'post_status' => 'private', 'post_title' => $name, 'meta_input' => [ '_slim_lead' => $data ] ], true );
	if ( is_wp_error( $id ) ) return $bad( 'The request did not go through. Please try again, or chat with us on LINE.', 500 );
	slim_lead_mail( (int) $id, $data );
	do_action( 'slim_consult_received', (int) $id, $data );
	return [ 'ok' => true ];
}

function slim_lead_mail( int $id, array $d ): void {
	$to = array_filter( array_map( 'trim', explode( ',', (string) slim_set( 'notify', get_option( 'admin_email' ) ) ) ), 'is_email' );
	if ( ! $to ) return;
	$goals = implode( ', ', array_map( fn( $g ) => SLIM_GOALS[ $g ], $d['goals'] ) );
	$body = "New consult request from the website.\n\n"
		. 'Name: ' . $d['name'] . "\n"
		. 'Phone: ' . ( $d['phone'] ?: '-' ) . "\n"
		. 'LINE ID: ' . ( $d['line'] ?: '-' ) . "\n"
		. 'Goals: ' . ( $goals ?: '-' ) . "\n"
		. 'Best time to call: ' . ( $d['time'] ?: '-' ) . "\n"
		. 'Sent from: ' . home_url( $d['page'] ?: '/' ) . "\n\n"
		. 'Open it in the admin: ' . admin_url( 'post.php?post=' . $id . '&action=edit' ) . "\n";
	wp_mail( $to, 'New consult request: ' . $d['name'], $body );
}

/* ---------- Enquiries in the admin ---------- */
function slim_lead( int $id ): array { $d = get_post_meta( $id, '_slim_lead', true ); return is_array( $d ) ? $d : []; }

add_filter( 'manage_slim_lead_posts_columns', fn() => [ 'cb' => '<input type="checkbox">', 'title' => 'Name', 'slim_reach' => 'Phone / LINE', 'slim_goals' => 'Goals', 'slim_time' => 'Best time', 'slim_status' => 'Status', 'date' => 'Received' ] );
add_action( 'manage_slim_lead_posts_custom_column', function ( $col, $id ) {
	$d = slim_lead( (int) $id );
	switch ( $col ) {
		case 'slim_reach': echo esc_html( implode( ' · ', array_filter( [ $d['phone'] ?? '', ( $d['line'] ?? '' ) !== '' ? 'LINE ' . $d['line'] : '' ] ) ) ); break;
		case 'slim_goals': echo esc_html( implode( ', ', array_map( fn( $g ) => SLIM_GOALS[ $g ] ?? $g, (array) ( $d['goals'] ?? [] ) ) ) ); break;
		case 'slim_time': echo esc_html( $d['time'] ?? '' ); break;
		case 'slim_status': $s = $d['status'] ?? 'new'; echo '<span class="slim-st slim-st-' . esc_attr( $s ) . '">' . esc_html( SLIM_LEAD_STATUS[ $s ] ?? $s ) . '</span>'; break;
	}
}, 10, 2 );
add_filter( 'post_row_actions', function ( $a, $post ) {
	if ( $post->post_type === 'slim_lead' ) unset( $a['inline hide-if-no-js'], $a['view'] );
	return $a;
}, 10, 2 );
add_filter( 'bulk_actions-edit-slim_lead', function ( $a ) { unset( $a['edit'] ); return $a; } );

/* the menu shows how many are new */
add_action( 'admin_menu', function () {
	global $menu;
	$n = slim_new_leads();
	if ( ! $n || ! is_array( $menu ) ) return;
	foreach ( $menu as $i => $m ) if ( ( $m[2] ?? '' ) === 'edit.php?post_type=slim_lead' ) $menu[ $i ][0] .= ' <span class="awaiting-mod"><span class="pending-count">' . (int) $n . '</span></span>';
}, 99 );
function slim_new_leads(): int {
	global $wpdb;
	return (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM $wpdb->posts p JOIN $wpdb->postmeta m ON m.post_id = p.ID AND m.meta_key = '_slim_lead' WHERE p.post_type = 'slim_lead' AND p.post_status = 'private' AND m.meta_value LIKE %s", '%' . $wpdb->esc_like( 's:6:"status";s:3:"new"' ) . '%' ) );
}

/* one enquiry: its details, the status and a note for staff */
add_action( 'add_meta_boxes_slim_lead', function ( $post ) {
	remove_meta_box( 'submitdiv', 'slim_lead', 'side' );
	remove_meta_box( 'slugdiv', 'slim_lead', 'normal' );
	add_meta_box( 'slim-lead', 'Request', 'slim_lead_box', 'slim_lead', 'normal', 'high' );
	add_meta_box( 'slim-lead-save', 'Status', 'slim_lead_status_box', 'slim_lead', 'side', 'high' );
	slim_audit( 'lead_open', (int) $post->ID );
} );
add_action( 'admin_head-post.php', function () {
	if ( get_current_screen()->post_type === 'slim_lead' ) echo '<style>#titlediv{display:none}</style>';
} );
function slim_lead_box( WP_Post $post ): void {
	$d = slim_lead( $post->ID );
	$c = (array) ( $d['consent'] ?? [] );
	$rows = [
		'Name' => $d['name'] ?? '', 'Phone' => $d['phone'] ?? '', 'LINE ID' => $d['line'] ?? '',
		'Goals' => implode( ', ', array_map( fn( $g ) => SLIM_GOALS[ $g ] ?? $g, (array) ( $d['goals'] ?? [] ) ) ),
		'Best time to call' => $d['time'] ?? '', 'Sent from' => $d['page'] ?? '',
		'Received' => get_the_date( 'j M Y H:i', $post ),
		'Consent' => ( $c['at'] ?? '' ) !== '' ? wp_date( 'j M Y H:i', strtotime( $c['at'] ) ) . ', privacy policy of ' . ( $c['policy'] ?: 'no date' ) : '',
		'Consent line' => $c['text'] ?? '',
	];
	echo '<table class="slim-lead">';
	foreach ( $rows as $k => $v ) echo '<tr><th>' . esc_html( $k ) . '</th><td>' . esc_html( (string) $v ) . '</td></tr>';
	echo '</table>';
	if ( ( $d['phone'] ?? '' ) !== '' ) echo '<p><a class="button" href="tel:' . esc_attr( preg_replace( '/[^0-9+]/', '', $d['phone'] ) ) . '">Call ' . esc_html( $d['phone'] ) . '</a></p>';
}
function slim_lead_status_box( WP_Post $post ): void {
	$d = slim_lead( $post->ID );
	wp_nonce_field( 'slim_lead_' . $post->ID, 'slim_lead_nonce' );
	echo '<p><label for="slim-lead-st"><b>Status</b></label><br><select id="slim-lead-st" name="slim_lead_status">';
	foreach ( SLIM_LEAD_STATUS as $k => $x ) echo '<option value="' . esc_attr( $k ) . '"' . selected( $d['status'] ?? 'new', $k, false ) . '>' . esc_html( $x ) . '</option>';
	echo '</select></p><p><label for="slim-lead-note"><b>Note for staff</b></label><textarea id="slim-lead-note" name="slim_lead_note" class="widefat" rows="4">' . esc_textarea( $d['note'] ?? '' ) . '</textarea></p>';
	echo '<p><button class="button button-primary" type="submit">Save</button> ';
	if ( current_user_can( 'delete_post', $post->ID ) ) echo '<a class="submitdelete" style="color:#b32d2e;margin-left:8px" href="' . esc_url( get_delete_post_link( $post->ID, '', true ) ) . '" onclick="return confirm(\'Delete this enquiry for good?\')">Delete for good</a>';
	echo '</p>';
}
add_action( 'save_post_slim_lead', function ( $id ) {
	if ( ! isset( $_POST['slim_lead_nonce'] ) || ! wp_verify_nonce( sanitize_key( $_POST['slim_lead_nonce'] ), 'slim_lead_' . $id ) || ! current_user_can( 'edit_post', $id ) ) return;
	$d = slim_lead( (int) $id );
	$st = sanitize_key( wp_unslash( $_POST['slim_lead_status'] ?? '' ) );
	$d['status'] = isset( SLIM_LEAD_STATUS[ $st ] ) ? $st : ( $d['status'] ?? 'new' );
	$d['note'] = sanitize_textarea_field( wp_unslash( $_POST['slim_lead_note'] ?? '' ) );
	update_post_meta( $id, '_slim_lead', wp_slash( $d ) );
	slim_audit( 'lead_save', (int) $id, SLIM_LEAD_STATUS[ $d['status'] ] );
} );
/* saving from the edit screen keeps it private */
add_filter( 'wp_insert_post_data', function ( $data ) {
	if ( $data['post_type'] === 'slim_lead' && ! in_array( $data['post_status'], [ 'trash', 'auto-draft' ], true ) ) $data['post_status'] = 'private';
	return $data;
} );
add_action( 'before_delete_post', function ( $id ) {
	if ( get_post_type( $id ) === 'slim_lead' && ! doing_action( 'slim_lead_expire' ) ) slim_audit( 'lead_delete', (int) $id );
} );

/* ---------- deletion after the keep period ---------- */
function slim_keep_days(): int { return max( 30, (int) slim_set( 'keepDays', 365 ) ); }
add_action( 'slim_lead_expire', function () {
	$ids = get_posts( [ 'post_type' => 'slim_lead', 'post_status' => 'any', 'numberposts' => 500, 'fields' => 'ids', 'date_query' => [ [ 'before' => slim_keep_days() . ' days ago' ] ] ] );
	foreach ( $ids as $id ) { wp_delete_post( $id, true ); slim_audit( 'lead_expire', (int) $id ); }
} );
add_action( 'init', function () { if ( ! wp_next_scheduled( 'slim_lead_expire' ) ) wp_schedule_event( strtotime( 'tomorrow 03:00' ), 'daily', 'slim_lead_expire' ); } );
add_action( 'switch_theme', function () { wp_clear_scheduled_hook( 'slim_lead_expire' ); } );

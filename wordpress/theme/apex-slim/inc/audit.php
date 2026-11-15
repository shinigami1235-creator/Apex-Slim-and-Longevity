<?php
/**
 * Access log: who opened, changed or deleted an enquiry, imported content, changed a setting, or got a new role. Enquiries › Access log shows it to administrators.
 *
 * The log keeps the newest 3,000 entries and drops anything older than 400 days. It sits in the option
 * slim_audit, which nobody can edit from the admin screens. A full activity log plugin (WP Activity Log or
 * Simple History) can run beside it for everything else.
 */
defined( 'ABSPATH' ) || exit;

const SLIM_AUDIT_MAX = 3000;
const SLIM_AUDIT_DAYS = 400;

/** Adds one entry. $what is one of the keys of slim_audit_labels(). */
function slim_audit( string $what, int $item = 0, string $note = '' ): void {
	$log = get_option( 'slim_audit' );
	$log = is_array( $log ) ? $log : [];
	$u = wp_get_current_user();
	$log[] = [
		'at' => time(),
		'user' => (int) $u->ID,
		'name' => $u->ID ? (string) $u->user_login : '',
		'what' => $what,
		'item' => $item,
		'note' => mb_substr( $note, 0, 200 ),
		'ip' => slim_ip_hash(),
	];
	$cut = time() - SLIM_AUDIT_DAYS * DAY_IN_SECONDS;
	$log = array_values( array_filter( $log, fn( $e ) => (int) ( $e['at'] ?? 0 ) >= $cut ) );
	if ( count( $log ) > SLIM_AUDIT_MAX ) $log = array_slice( $log, -SLIM_AUDIT_MAX );
	update_option( 'slim_audit', $log, false );
}
function slim_audit_labels(): array {
	return [
		'lead_open' => __( 'Opened an enquiry', 'slim' ),
		'lead_save' => __( 'Changed an enquiry', 'slim' ),
		'lead_delete' => __( 'Deleted an enquiry', 'slim' ),
		'lead_expire' => __( 'Enquiry deleted after the keep period', 'slim' ),
		'import' => __( 'Imported content', 'slim' ),
		'settings' => __( 'Changed settings', 'slim' ),
		'role' => __( 'Changed a user\'s role', 'slim' ),
		'login' => __( 'Logged in', 'slim' ),
	];
}

/* staff with access to enquiries: their logins */
add_action( 'wp_login', function ( $login, $user ) {
	if ( ! $user instanceof WP_User || ! user_can( $user, 'edit_slim_leads' ) ) return;
	wp_set_current_user( $user->ID );
	slim_audit( 'login' );
}, 10, 2 );

/* role changes */
add_action( 'set_user_role', function ( $id, $role, $old ) {
	$u = get_userdata( $id );
	slim_audit( 'role', (int) $id, ( $u ? $u->user_login : '#' . $id ) . ': ' . implode( ', ', (array) $old ) . ' → ' . $role );
}, 10, 3 );
add_action( 'user_register', function ( $id ) {
	$u = get_userdata( $id );
	if ( $u && array_intersect( (array) $u->roles, [ 'administrator', 'slim_staff' ] ) ) slim_audit( 'role', (int) $id, $u->user_login . ': new account, ' . implode( ', ', $u->roles ) );
} );

/* Enquiries › Access log */
add_action( 'admin_menu', function () {
	add_submenu_page( 'edit.php?post_type=slim_lead', __( 'Access log', 'slim' ), __( 'Access log', 'slim' ), 'manage_options', 'slim-audit', 'slim_audit_page' );
} );
function slim_audit_page(): void {
	if ( ! current_user_can( 'manage_options' ) ) return;
	$log = get_option( 'slim_audit' );
	$log = array_reverse( is_array( $log ) ? $log : [] );
	$who = isset( $_GET['who'] ) ? sanitize_user( wp_unslash( $_GET['who'] ) ) : '';
	if ( $who !== '' ) $log = array_values( array_filter( $log, fn( $e ) => ( $e['name'] ?? '' ) === $who ) );
	$L = slim_audit_labels();
	echo '<div class="wrap"><h1>' . esc_html__( 'Access log', 'slim' ) . '</h1><p>' . esc_html( sprintf( __( 'Who opened enquiries, and who changed settings or roles. The newest %1$s entries from the last %2$s days are kept.', 'slim' ), number_format_i18n( SLIM_AUDIT_MAX ), SLIM_AUDIT_DAYS ) ) . '</p>';
	echo '<form method="get"><input type="hidden" name="post_type" value="slim_lead"><input type="hidden" name="page" value="apex-audit"><input name="who" class="regular-text" placeholder="' . esc_attr__( 'User name', 'slim' ) . '" value="' . esc_attr( $who ) . '"> ';
	submit_button( __( 'Show only this user', 'slim' ), 'secondary', '', false );
	echo '</form><table class="widefat striped" style="margin-top:12px"><thead><tr><th>' . esc_html__( 'When', 'slim' ) . '</th><th>' . esc_html__( 'Who', 'slim' ) . '</th><th>' . esc_html__( 'What', 'slim' ) . '</th><th>' . esc_html__( 'Item', 'slim' ) . '</th><th>' . esc_html__( 'Details', 'slim' ) . '</th></tr></thead><tbody>';
	if ( ! $log ) echo '<tr><td colspan="5">' . esc_html__( 'Nothing logged yet.', 'slim' ) . '</td></tr>';
	foreach ( array_slice( $log, 0, 500 ) as $e ) {
		$item = (int) ( $e['item'] ?? 0 );
		$it = '';
		if ( $item && in_array( $e['what'], [ 'lead_open', 'lead_save', 'lead_delete', 'lead_expire' ], true ) ) $it = 'A' . $item;
		echo '<tr><td>' . esc_html( wp_date( 'j M Y H:i', (int) $e['at'] ) ) . '</td><td>' . esc_html( ( $e['name'] ?? '' ) !== '' ? $e['name'] : __( 'The site', 'slim' ) ) . '</td><td>' . esc_html( $L[ $e['what'] ] ?? $e['what'] ) . '</td><td>' . esc_html( $it ) . '</td><td>' . esc_html( (string) ( $e['note'] ?? '' ) ) . '</td></tr>';
	}
	echo '</tbody></table></div>';
}

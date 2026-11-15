<?php
/**
 * Apex Slim and Longevity theme.
 *
 * Every page is drawn by PHP with the same markup as the design in the repo root, so assets/css/slim.css and
 * the scripts in assets/js run on it unchanged. The scripts read the treatments, Results cases, meals and the
 * consult address from window.SLIM_DATA, which inc/render.php prints from the admin content.
 *
 * inc/helpers.php   images, links, escaping
 * inc/schema.php    the fields of every content type, shared by the admin forms, the importer and the data layer
 * inc/types.php     treatments, Results cases, enquiries and the fixed pages
 * inc/fields.php    the admin forms built from the schema, and Apex Slim › Settings
 * inc/data.php      content read back for the templates and the scripts
 * inc/render.php    the page templates (a PHP copy of index.html, lab.html and tools/build_tx.py)
 * inc/forms.php     the consult request form: REST endpoint, Enquiries inbox, email, deletion after the keep period
 * inc/seo.php       titles, descriptions, Open Graph, JSON-LD when no SEO plugin is active
 * inc/tracking.php  Google Tag Manager with Consent Mode v2 and the cookie banner, off until a container is set
 * inc/media.php     uploads saved as WebP, Results pod pictures cut from the before and after photos
 * inc/security.php  hardening
 * inc/audit.php     access log: who opened enquiries, changed settings or roles
 * inc/io.php        content import, export and check (Tools › Apex Slim content, and wp slim on the command line)
 * inc/admin.php     menus, columns, dashboard
 */
defined( 'ABSPATH' ) || exit;

define( 'SLIM_VERSION', '1.0.0' );   // keep in step with Version in style.css; tools/build_theme.py checks both
define( 'SLIM_DIR', __DIR__ );
define( 'SLIM_URI', get_template_directory_uri() );

add_filter( 'update_footer', fn( $t ) => 'Apex Slim theme ' . SLIM_VERSION . ' · ' . $t, 20 );

foreach ( [ 'helpers', 'schema', 'types', 'fields', 'data', 'render', 'forms', 'seo', 'tracking', 'media', 'security', 'audit', 'io', 'admin' ] as $f ) {
	require_once SLIM_DIR . "/inc/$f.php";
}
if ( defined( 'WP_CLI' ) && WP_CLI ) {
	require_once SLIM_DIR . '/inc/cli.php';
}

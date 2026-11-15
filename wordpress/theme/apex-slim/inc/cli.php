<?php
/**
 * wp slim import [<file>]   imports content.json (the one that came with the theme when no file is given)
 * wp slim export [<file>]   writes the site's content as content.json
 * wp slim check             lists what to fix before launch; exits with 1 when something must be fixed
 */
defined( 'ABSPATH' ) || exit;

WP_CLI::add_command( 'slim', new class {
	/** Imports content.json. ## OPTIONS [<file>] */
	public function import( $args ) {
		$file = $args[0] ?? SLIM_DIR . '/content.json';
		$d = json_decode( (string) @file_get_contents( $file ), true );
		if ( ! is_array( $d ) ) WP_CLI::error( "Cannot read $file as JSON." );
		foreach ( slim_import( $d ) as $l ) WP_CLI::log( $l );
		WP_CLI::success( 'Imported.' );
	}
	/** Writes the content as JSON. ## OPTIONS [<file>] */
	public function export( $args ) {
		$json = wp_json_encode( slim_export(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES );
		if ( empty( $args[0] ) ) { WP_CLI::line( $json ); return; }
		file_put_contents( $args[0], $json );
		WP_CLI::success( 'Wrote ' . $args[0] );
	}
	/** Lists what to fix before launch. */
	public function check() {
		$p = slim_check();
		foreach ( $p as [ $lvl, $m ] ) WP_CLI::log( ( $lvl === 'error' ? 'Fix:  ' : 'Note: ' ) . $m );
		if ( array_filter( $p, fn( $x ) => $x[0] === 'error' ) ) WP_CLI::halt( 1 );
		WP_CLI::success( $p ? 'Only notes.' : 'Nothing to fix.' );
	}
} );

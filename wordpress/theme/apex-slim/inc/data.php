<?php
/**
 * Content read back for the templates and for the page scripts (window.SLIM_DATA).
 */
defined( 'ABSPATH' ) || exit;

/** Called after any content change. Page cache plugins can listen for slim_data_changed and clear. */
function slim_data_bump(): void {
	update_option( 'slim_data_v', time(), true );
	do_action( 'slim_data_changed' );
}

/** Published treatments in their admin order, each with its fields, address and post ID. */
function slim_treatments( bool $all = false ): array {
	static $memo = [];
	if ( isset( $memo[ $all ] ) ) return $memo[ $all ];
	$out = [];
	$q = get_posts( [ 'post_type' => 'slim_treatment', 'post_status' => $all ? [ 'publish', 'draft', 'private', 'pending' ] : 'publish', 'numberposts' => 100, 'orderby' => [ 'menu_order' => 'ASC', 'ID' => 'ASC' ], 'no_found_rows' => true ] );
	foreach ( $q as $p ) $out[] = slim_read_post( $p, 'slim_treatment' ) + [ 'id' => $p->ID, 'url' => get_permalink( $p ), 'status' => $p->post_status ];
	return $memo[ $all ] = $out;
}
function slim_treatment_by( string $field, string $v ): ?array {
	foreach ( slim_treatments() as $t ) if ( (string) $t[ $field ] === $v ) return $t;
	return null;
}
/** The key the page scripts use for a treatment: its symbol in lower case (cs, en, ...). */
function slim_tx_js_key( array $t ): string { return strtolower( preg_replace( '/[^A-Za-z0-9]/', '', (string) $t['sym'] ) ); }

/** Minutes to read a treatment page, at 200 words a minute, as tools/build_tx.py counts them. */
function slim_read_mins( array $t ): int {
	$text = implode( ' ', (array) $t['hook'] ) . (string) $t['body'];
	foreach ( (array) $t['faq'] as $r ) $text .= ( $r['q'] ?? '' ) . ( $r['a'] ?? '' );
	$text = preg_replace( '/<[^>]+>/', ' ', $text );
	$n = count( preg_split( '/\s+/', trim( $text ), -1, PREG_SPLIT_NO_EMPTY ) );
	return max( 1, (int) ceil( $n / 200 ) );
}

/** Published Results cases in their admin order. */
function slim_cases(): array {
	static $memo = null;
	if ( $memo !== null ) return $memo;
	$memo = [];
	foreach ( get_posts( [ 'post_type' => 'slim_case', 'post_status' => 'publish', 'numberposts' => 50, 'orderby' => [ 'menu_order' => 'ASC', 'ID' => 'ASC' ], 'no_found_rows' => true ] ) as $p ) {
		$memo[] = slim_read_post( $p, 'slim_case' ) + [ 'id' => $p->ID ];
	}
	return $memo;
}

/** A fixed page's fields. */
function slim_page_vals( string $k ): array {
	$id = slim_page_id( $k );
	$p = $id ? get_post( $id ) : null;
	return $p ? slim_read_post( $p, 'page:' . $k ) : [];
}

/** What the page scripts read: treatments for the mixing bench and body check, the Results cases, the meals. */
function slim_js_data( string $view ): array {
	$T = [];
	foreach ( slim_treatments() as $t ) {
		$T[ slim_tx_js_key( $t ) ] = [
			'sym' => $t['sym'], 'name' => $t['name'], 'url' => $t['url'], 'goal' => $t['goal'], 'cls' => $t['cls'] ?: '',
			'time' => $t['bench']['time'] ?? '', 'desc' => $t['bench']['desc'] ?? '',
		];
	}
	$d = [
		'T' => $T, 'base' => SLIM_URI . '/assets/', 'home' => slim_home(),
		'consult' => rest_url( 'slim/v1/consult' ),
		'sent' => slim_set( 'consult', [] )['sent'] ?? '',
	];
	if ( $view === 'home' ) {
		$d['cases'] = [];
		foreach ( slim_cases() as $c ) {
			$tx = [];
			foreach ( (array) $c['tx'] as $sym ) if ( $t = slim_treatment_by( 'sym', $sym ) ) $tx[] = [ 'sym' => $t['sym'], 'name' => $t['name'] ];
			$pod = (array) $c['pod'];
			$raw = (array) $c['raw'];
			if ( ! $tx || count( $pod ) < 2 || empty( $raw['before'] ) || empty( $raw['after'] ) ) continue;   // a case needs both photos and a treatment
			$d['cases'][] = [
				'id' => $c['key'], 'title' => $c['title'], 'tx' => $tx,
				'before' => slim_img( $pod[0] ), 'after' => slim_img( $pod[1] ),
				'raw' => [ slim_img( $raw['before'] ), slim_img( $raw['after'] ) ], 'wide' => (bool) $c['wide'],
				'bdate' => (string) $c['bdate'], 'adate' => (string) $c['adate'],
				'facts' => array_map( fn( $r ) => [ $r['k'], $r['v'] ], (array) $c['facts'] ),
				'video' => (string) $c['video'] ?: null, 'poster' => slim_img( (string) $c['poster'] ),
				'img' => slim_img( (string) $c['img'] ), 'imgCap' => (string) $c['imgCap'],
			];
		}
	}
	if ( $view === 'lab' ) {
		$m = [];
		foreach ( (array) ( slim_page_vals( 'lab' )['meals'] ?? [] ) as $row ) {
			$m[ $row['meal'] ] = array_map( fn( $x ) => [ $x['en'], $x['th'], $x['tip'] ], (array) ( $row['dishes'] ?? [] ) );
		}
		$d['meals'] = $m;
	}
	return $d;
}

<?php
/**
 * Titles, descriptions, Open Graph and JSON-LD. When Yoast, Rank Math, SEOPress or All in One SEO is active,
 * the plugin writes the description, Open Graph and JSON-LD instead, and this file only sets the titles.
 * The sitemap is WordPress's own (/wp-sitemap.xml): the home, lab and privacy pages and every treatment.
 */
defined( 'ABSPATH' ) || exit;

function slim_seo_plugin(): bool {
	return defined( 'WPSEO_VERSION' ) || defined( 'RANK_MATH_VERSION' ) || defined( 'SEOPRESS_VERSION' ) || defined( 'AIOSEO_VERSION' );
}

/** Title, description and share picture of the page being drawn. */
function slim_seo(): array {
	$site = slim_set( 'siteName', 'Apex Slim and Longevity' );
	$o = [ 'title' => $site, 'desc' => '', 'img' => (string) slim_set( 'ogImage' ), 'type' => 'website' ];
	switch ( slim_view() ) {
		case 'home':
			$P = slim_page_vals( 'home' );
			$o['title'] = ( $P['seoTitle'] ?? '' ) ?: $site;
			$o['desc'] = (string) ( $P['seoDesc'] ?? '' );
			break;
		case 'lab':
			$P = slim_page_vals( 'lab' );
			$o['title'] = ( $P['seoTitle'] ?? '' ) ?: ( $P['h1'] ?? 'Slim Wellness Lab' ) . ' | ' . $site;
			$o['desc'] = (string) ( $P['seoDesc'] ?? '' );
			break;
		case 'treatment':
			$t = slim_treatment_by( 'id', (string) get_queried_object_id() );
			if ( $t ) {
				$o['title'] = $t['name'] . ' | ' . $site;
				$o['desc'] = (string) $t['desc'];
				if ( ! empty( $t['device']['src'] ) ) $o['img'] = $t['device']['src'];
				$o['type'] = 'article';
			}
			break;
		case 'page':
			$o['title'] = get_the_title( get_queried_object_id() ) . ' | ' . $site;
			break;
		default:
			$o['title'] = 'Page not found | ' . $site;
	}
	return $o;
}

add_filter( 'pre_get_document_title', fn() => slim_seo()['title'], 20 );

add_action( 'wp_head', function () {
	if ( slim_seo_plugin() || is_404() ) return;
	$s = slim_seo();
	$url = slim_view() === 'home' ? slim_home() : ( is_singular() ? get_permalink() : '' );
	if ( $s['desc'] !== '' ) echo '<meta name="description" content="' . esc_attr( $s['desc'] ) . '">' . "\n";
	echo '<meta property="og:type" content="' . esc_attr( $s['type'] ) . '">' . "\n";
	echo '<meta property="og:site_name" content="' . esc_attr( slim_set( 'siteName', 'Apex Slim and Longevity' ) ) . '">' . "\n";
	echo '<meta property="og:title" content="' . esc_attr( $s['title'] ) . '">' . "\n";
	if ( $s['desc'] !== '' ) echo '<meta property="og:description" content="' . esc_attr( $s['desc'] ) . '">' . "\n";
	if ( $url ) echo '<meta property="og:url" content="' . esc_url( $url ) . '">' . "\n";
	if ( $s['img'] !== '' ) {
		echo '<meta property="og:image" content="' . esc_url( slim_img( $s['img'] ) ) . '">' . "\n";
		if ( $d = slim_dims( $s['img'] ) ) echo '<meta property="og:image:width" content="' . $d[0] . '">' . "\n" . '<meta property="og:image:height" content="' . $d[1] . '">' . "\n";
	}
	echo '<meta name="twitter:card" content="summary_large_image">' . "\n";
	$ld = slim_jsonld();
	if ( $ld ) echo '<script type="application/ld+json">' . wp_json_encode( $ld, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG ) . "</script>\n";
}, 3 );

/* the home page's canonical: WordPress gives one to every other page */
add_action( 'wp_head', function () {
	if ( ! slim_seo_plugin() && is_front_page() && ! is_singular() ) echo '<link rel="canonical" href="' . esc_url( slim_home() ) . '">' . "\n";
}, 4 );

function slim_jsonld(): array {
	$site = slim_set( 'siteName', 'Apex Slim and Longevity' );
	$clinic = [
		'@type' => 'MedicalClinic', '@id' => slim_home() . '#clinic', 'name' => $site, 'url' => slim_home(),
		'logo' => slim_asset( 'img/favicon.svg' ),
		'parentOrganization' => [ '@type' => 'MedicalOrganization', 'name' => 'Apex Medical Center', 'url' => 'https://www.apexmedicalcenter.co.th/' ],
		'sameAs' => array_values( array_filter( array_map( fn( $s ) => $s['h'] ?? '', (array) slim_set( 'socials', [] ) ) ) ),
	];
	if ( slim_set( 'ogImage' ) !== '' ) $clinic['image'] = slim_img( slim_set( 'ogImage' ) );
	$graph = [ $clinic ];
	if ( slim_view() === 'treatment' && ( $t = slim_treatment_by( 'id', (string) get_queried_object_id() ) ) ) {
		$graph[] = [ '@type' => 'MedicalProcedure', 'name' => $t['name'], 'description' => $t['desc'], 'url' => $t['url'], 'procedureType' => 'https://schema.org/NoninvasiveProcedure' ];
		if ( $t['faq'] ) $graph[] = [ '@type' => 'FAQPage', 'mainEntity' => array_map( fn( $r ) => [ '@type' => 'Question', 'name' => $r['q'], 'acceptedAnswer' => [ '@type' => 'Answer', 'text' => wp_strip_all_tags( $r['a'] ) ] ], (array) $t['faq'] ) ];
		$is_tx = $t['group'] === 'treatments';
		$graph[] = [ '@type' => 'BreadcrumbList', 'itemListElement' => [
			[ '@type' => 'ListItem', 'position' => 1, 'name' => $is_tx ? 'Treatments' : 'Longevity', 'item' => slim_home() . ( $is_tx ? '#treatments' : '#longevity' ) ],
			[ '@type' => 'ListItem', 'position' => 2, 'name' => $t['name'], 'item' => $t['url'] ],
		] ];
	}
	return [ '@context' => 'https://schema.org', '@graph' => $graph ];
}

/* the sitemap: no user pages, no Results cases or enquiries */
add_filter( 'wp_sitemaps_add_provider', fn( $p, $name ) => $name === 'users' ? false : $p, 10, 2 );
add_filter( 'wp_sitemaps_post_types', function ( $t ) { unset( $t['post'], $t['slim_case'], $t['slim_lead'], $t['attachment'] ); return $t; } );
add_filter( 'wp_sitemaps_taxonomies', '__return_empty_array' );

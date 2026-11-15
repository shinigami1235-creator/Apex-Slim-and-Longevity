<?php
/**
 * The page templates: a PHP copy of index.html, lab.html and the treatment page in tools/build_tx.py, with the
 * same markup, filled from the admin. When the design changes, change the static page and this file together;
 * tests/wordpress/compare.py fails when the two stop matching.
 */
defined( 'ABSPATH' ) || exit;

add_action( 'after_setup_theme', function () {
	add_theme_support( 'title-tag' );
	add_theme_support( 'html5', [ 'script', 'style' ] );
} );

/* nothing but this theme's views: posts, archives, search and attachment pages are not part of the site */
add_filter( 'template_include', fn() => SLIM_DIR . '/index.php', 99 );
add_action( 'template_redirect', function () {
	if ( is_feed() || is_search() || is_archive() || is_attachment() || ( is_singular( 'post' ) ) || ( is_home() && ! is_front_page() ) ) {
		global $wp_query;
		$wp_query->set_404();
		status_header( 404 );
		nocache_headers();
	}
} );
/* the speculation rules WordPress adds (6.8+): fetch a page as soon as a pointer rests on its link */
add_filter( 'wp_speculation_rules_configuration', fn( $c ) => is_array( $c ) ? [ 'mode' => 'prefetch', 'eagerness' => 'moderate' ] : $c );

/** Which view this request draws. */
function slim_view(): string {
	if ( is_404() ) return '404';
	if ( is_front_page() ) return 'home';
	if ( is_singular( 'slim_treatment' ) ) return 'treatment';
	if ( is_page() ) {
		$k = (string) get_post_meta( get_queried_object_id(), '_slim_page', true );
		return $k === 'lab' ? 'lab' : ( $k === 'home' ? 'home' : 'page' );
	}
	return '404';
}

function slim_render(): void {
	$view = slim_view();
	if ( $view === 'home' && ! slim_page_id( 'home' ) && ! slim_treatments() ) { slim_render_empty(); return; }
	slim_enqueue( $view );
	$tx = $view === 'treatment' ? slim_treatment_by( 'id', (string) get_queried_object_id() ) : null;
	slim_head( $view, $tx );
	switch ( $view ) {
		case 'home': slim_view_home(); break;
		case 'lab': slim_view_lab(); break;
		case 'treatment': $tx ? slim_view_treatment( $tx ) : slim_view_404(); break;
		case 'page': slim_view_page(); break;
		default: slim_view_404();
	}
	slim_foot();
}

/** Before the first import: a plain note instead of an empty design. */
function slim_render_empty(): void {
	echo '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Apex Slim and Longevity</title></head><body style="font:16px/1.6 system-ui;max-width:640px;margin:10vh auto;padding:0 20px">';
	echo '<h1>Apex Slim and Longevity</h1><p>The theme is installed and has no content yet. An administrator imports it under Tools › Apex Slim content.</p></body></html>';
}

/* ---------- styles and scripts ---------- */
function slim_enqueue( string $view ): void {
	wp_enqueue_style( 'slim', slim_asset( 'css/slim.css' ), [], SLIM_VERSION );
	$js = fn( $h, $f, $deps = [] ) => wp_enqueue_script( 'slim-' . $h, slim_asset( 'js/' . $f ), $deps, SLIM_VERSION, true );
	if ( $view === 'home' ) $js( 'mix-data', 'mix-data.js' );
	$js( 'main', 'slim.js' );
	wp_add_inline_script( 'slim-main', 'window.SLIM_DATA=' . wp_json_encode( slim_js_data( $view ), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG ) . ';', 'before' );
	if ( $view === 'home' && slim_has_cases() ) { $js( 'results-map', 'results-map.js', [ 'slim-main' ] ); $js( 'results', 'results.js', [ 'slim-results-map' ] ); }
	if ( $view === 'treatment' ) $js( 'tx', 'tx.js', [ 'slim-main' ] );
	if ( $view === 'lab' ) {
		wp_enqueue_script_module( 'slim-bodycheck', slim_asset( 'js/bodycheck.js' ), [], SLIM_VERSION );
		wp_enqueue_script_module( 'slim-goalphoto', slim_asset( 'js/goalphoto.js' ), [], SLIM_VERSION );
		$js( 'meals', 'meals.js', [ 'slim-main' ] );
	}
	wp_enqueue_script_module( 'slim-buddy', slim_asset( 'js/buddy.js' ), [], SLIM_VERSION );
}
function slim_has_cases(): bool { return (bool) array_filter( slim_cases(), fn( $c ) => count( (array) $c['pod'] ) >= 2 ); }

add_action( 'wp_head', function () {
	echo '<meta name="text-scale" content="scale">' . "\n" . '<meta name="color-scheme" content="only light">' . "\n";
	if ( ! has_site_icon() ) echo '<link rel="icon" href="' . esc_url( slim_asset( 'img/favicon.svg' ) ) . '" type="image/svg+xml">' . "\n";
	echo '<link rel="preload" href="' . esc_url( slim_asset( 'fonts/LINESeed-Bd-latin.woff2' ) ) . '" as="font" type="font/woff2" crossorigin>' . "\n";
}, 2 );
/* no block library styles: nothing on these pages uses blocks except the privacy policy text */
add_action( 'wp_enqueue_scripts', function () {
	if ( slim_view() !== 'page' ) { wp_dequeue_style( 'wp-block-library' ); wp_dequeue_style( 'global-styles' ); wp_dequeue_style( 'classic-theme-styles' ); }
}, 100 );

/* ---------- shell ---------- */
function slim_head( string $view, ?array $tx ): void {
	$h = $view === 'home' ? '' : slim_home();
	$cur = fn( $on ) => $on ? ' aria-current="page"' : '';
	$group = $tx['group'] ?? '';
	$book = in_array( $view, [ 'home', 'treatment' ], true ) ? '#consult' : $h . '#consult';
	?><!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<?php wp_head(); ?>
</head>
<body>
<?php wp_body_open(); ?>

<a class="skip-link" href="#content">Skip to main content</a>
<header class="top">
  <div class="wrap">
    <a class="brand" href="<?php echo esc_url( slim_home() ); ?>">
      <svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="16" fill="#6A388C"/><path d="M18 48 32 16l14 32" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M24 38h16" stroke="#C9B3DD" stroke-width="4" stroke-linecap="round"/></svg>
      <span><?php echo slim_t( slim_set( 'brand', 'Apex Slim' ) ); ?><small><?php echo slim_t( slim_set( 'brandSmall', 'and Longevity' ) ); ?></small></span>
    </a>
    <button class="menu-btn" aria-expanded="false" aria-controls="nav" aria-label="Menu"><svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>
    <nav class="nav" id="nav" aria-label="Main">
      <a href="<?php echo esc_url( $h . '#treatments' ); ?>"<?php echo $cur( $group === 'treatments' ); ?>>Treatments</a>
      <a href="<?php echo esc_url( $h . '#longevity' ); ?>"<?php echo $cur( $group === 'longevity' ); ?>>Longevity</a>
      <a href="<?php echo esc_url( $h . '#results' ); ?>">Results</a>
      <a href="<?php echo esc_url( $h . '#notes' ); ?>">Lab Notes</a>
      <a href="<?php echo esc_url( slim_lab_url() ); ?>"<?php echo $cur( $view === 'lab' ); ?>>Wellness Lab</a>
      <a class="btn" href="<?php echo esc_url( $book ); ?>">Book a consult</a>
    </nav>
  </div>
</header>

<main id="content" tabindex="-1">
<?php
}

function slim_foot(): void {
	$legal = array_filter( [
		slim_t( slim_set( 'company' ) ),
		slim_set( 'permit' ) !== '' ? slim_t( 'Advertising permit ' . slim_set( 'permit' ) ) : '',
		( $pp = slim_privacy_url() ) ? '<a href="' . esc_url( $pp ) . '">Privacy policy</a>' : '',
	] );
	?>
</main>

<footer class="foot">
  <div class="wrap">
    <div><b><?php echo slim_t( slim_set( 'siteName', 'Apex Slim and Longevity' ) ); ?></b><br><?php echo slim_t( slim_set( 'groupLine' ) ); ?><br><?php echo slim_t( slim_set( 'vary' ) ); ?><?php if ( $legal ) echo '<br><span class="foot-legal">' . implode( ' · ', $legal ) . '</span>'; ?></div>
    <nav aria-label="Social">
<?php foreach ( (array) slim_set( 'socials', [] ) as $s ) echo '      <a href="' . esc_url( $s['h'] ) . '" target="_blank" rel="noopener">' . slim_t( $s['x'] ) . "</a>\n"; ?>
    </nav>
  </div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
<?php
}

/* ---------- shared parts ---------- */
function slim_tile( array $t, string $line ): string {
	$icon = SLIM_ICONS[ $t['icon'] ?? '' ] ?? SLIM_ICONS[ $t['sym'] ] ?? SLIM_ICONS['Wk'];
	return '<a class="el' . ( $t['cls'] ? ' ' . esc_attr( $t['cls'] ) : '' ) . '" href="' . esc_url( $t['url'] ) . '"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' . $icon . '</svg><span class="sym">' . slim_t( $t['sym'] ) . '</span><span><span class="nm">' . slim_t( $t['name'] ) . '</span><br><span class="ft">' . slim_t( $line ) . '</span></span></a>';
}

function slim_consult( bool $tx_page, string $goal = '' ): void {
	$c = (array) slim_set( 'consult', [] );
	$line = (array) slim_set( 'line', [] );
	$pp = slim_privacy_url();
	?>
<section class="sec" id="consult"<?php echo $tx_page ? ' style="padding-top:0"' : ''; ?> aria-labelledby="h-consult">
  <div class="wrap request">
    <div>
      <h2 id="h-consult"><?php echo slim_t( $c['h'] ?? 'Book a consult' ); ?></h2>
      <p class="lede" style="margin-top:20px"><?php echo slim_t( $c['p'] ?? '' ); ?></p>
<?php if ( ! empty( $line['url'] ) ) : ?>
      <a class="line-link" href="<?php echo esc_url( $line['url'] ); ?>" target="_blank" rel="noopener"><span class="qr">LINE</span><span><b>Chat on LINE</b><?php echo slim_t( $line['id'] ?? '' ); ?></span></a>
<?php endif; ?>
    </div>
    <form class="form" id="request"<?php echo $goal ? ' data-goals="' . esc_attr( $goal ) . '"' : ''; ?> novalidate>
      <div class="form-head"><b><?php echo slim_t( $c['formHead'] ?? 'Request form' ); ?></b><span><?php echo slim_t( slim_set( 'siteName', 'Apex Slim and Longevity' ) ); ?></span></div>
      <div class="form-body">
        <div class="field"><label for="f-name">Name</label><input id="f-name" name="name" autocomplete="name" required aria-describedby="f-msg" enterkeyhint="next" maxlength="100"></div>
        <div class="row2">
        <div class="field"><label for="f-phone">Phone</label><input id="f-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" aria-describedby="f-reach f-msg" enterkeyhint="next" maxlength="30"></div>
        <div class="field"><label for="f-line">LINE ID</label><input id="f-line" name="line" autocomplete="off" autocapitalize="none" spellcheck="false" aria-describedby="f-reach f-msg" enterkeyhint="next" maxlength="50"></div>
        </div>
        <p class="bc-hint" id="f-reach">Fill in at least one.</p>
        <fieldset class="field">
          <legend>Goals <span class="opt">(optional)</span></legend>
          <div class="checks">
<?php foreach ( SLIM_GOALS as $k => $x ) echo '            <label><input type="checkbox" name="goal" value="' . esc_attr( $k ) . '"><span>' . esc_html( $x ) . "</span></label>\n"; ?>
          </div>
        </fieldset>
        <div class="field"><label for="f-time">Best time to call</label>
          <select id="f-time" name="time"><?php foreach ( (array) ( $c['times'] ?? [] ) as $x ) echo '<option>' . slim_t( $x ) . '</option>'; ?></select>
        </div>
        <label class="consent"><input type="checkbox" name="consent" required aria-describedby="f-msg"><?php echo slim_t( $c['consent'] ?? '' ); ?><?php if ( $pp ) echo ' <a href="' . esc_url( $pp ) . '" target="_blank">Privacy policy</a>'; ?></label>
        <div class="hp" aria-hidden="true"><label for="f-website">Website</label><input id="f-website" name="website" tabindex="-1" autocomplete="off"></div>
        <div><button class="btn" type="submit">Send request</button></div>
        <p class="form-msg" id="f-msg" role="status"></p>
      </div>
    </form>
  </div>
</section>
<?php
}

/* ---------- home ---------- */
function slim_view_home(): void {
	$P = slim_page_vals( 'home' );
	$g = fn( $k, $d = '' ) => slim_t( $P[ $k ] ?? $d );
	$txs = slim_treatments();
	$by = fn( $grp ) => array_values( array_filter( $txs, fn( $t ) => $t['group'] === $grp ) );
	$lab = slim_lab_url();
	?>

<section class="bench" aria-labelledby="h-bench">
  <div class="wrap">
    <div class="bench-intro">
      <h1 id="h-bench"><?php echo $g( 'h1' ); ?></h1>
      <p class="lede"><?php echo $g( 'lede' ); ?></p>
    </div>

    <div class="flask-box">
      <p class="st-status" id="st-status" aria-live="polite"></p>
      <div class="lab-stage" id="stage" role="img" aria-label="Glass flask where the ingredients you pick are poured and mixed">
        <img class="st-still" id="st-empty" src="<?php echo esc_url( slim_asset( 'img/lab/mix2/flask-empty.webp' ) ); ?>" alt="" width="840" height="840" fetchpriority="high">
        <video class="st-video" id="st-video" muted playsinline preload="none" aria-hidden="true"></video>
        <div class="st-liquid" id="st-liquid"></div>
        <div class="st-fx" id="st-fx"></div>
        <img class="st-still st-mixed" id="st-mixed" alt="" width="840" height="840">
        <i class="st-foam" id="st-foam" aria-hidden="true"></i>
        <div class="st-bubbles" id="st-bubbles" aria-hidden="true"></div>
        <div class="st-finish" id="st-finish" aria-hidden="true"></div>
        <svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="swirl" x="0" y="0" width="100%" height="100%"><feTurbulence id="swirl-turb" type="fractalNoise" baseFrequency="0.012 0.03" numOctaves="2" seed="3"/><feDisplacementMap id="swirl-disp" in="SourceGraphic" scale="0" xChannelSelector="R" yChannelSelector="G"/></filter></svg>
      </div>
    </div>

    <div class="shelf" role="group" aria-labelledby="shelf-h">
      <p id="shelf-h"><?php echo $g( 'shelf' ); ?></p>
<?php foreach ( SLIM_GOALS as $k => $x ) echo '      <button class="bottle" type="button" data-goal="' . $k . '" aria-pressed="false"><img src="' . esc_url( slim_asset( "img/lab/bottle-$k.webp" ) . '?v=' . SLIM_BOTTLE_V[ $k ] ) . '" alt="" width="240" height="300">' . esc_html( $x ) . "</button>\n"; ?>
      <div class="mix-row"><button class="btn" type="button" id="mix-btn">Mix formula</button><a class="btn" id="see-rx" href="#rx" hidden>See your treatments</a><button class="btn ghost" type="button" id="start-over" hidden>Start over</button><p class="mix-msg" id="mix-msg" role="status"></p></div>
    </div>
  </div>
  <div class="bench-line"></div>
</section>

<section class="formula" aria-labelledby="h-formula">
  <div class="wrap">
    <h2 id="h-formula">Your formula</h2>
    <div class="chem" id="chem" aria-live="polite"></div>
  </div>
  <div class="rx" id="rx" hidden>
    <div class="wrap">
      <h3 id="h-rx">Treatments for your formula</h3>
      <p class="rx-intro"><?php echo $g( 'rxIntro' ); ?></p>
      <div class="rx-list" id="rx-list"></div>
      <div class="formula-actions">
        <a class="btn" id="book-formula" href="#consult">Book a consult with this formula</a>
        <button class="btn ghost" type="button" id="restart">Start over</button>
      </div>
    </div>
  </div>
</section>

<section class="sec" id="treatments" aria-labelledby="h-tx">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="h-tx"><?php echo $g( 'txH', 'Treatments' ); ?></h2>
      <p><?php echo $g( 'txP' ); ?></p>
    </div>
    <div class="table">
<?php
	foreach ( $by( 'treatments' ) as $t ) echo '      ' . slim_tile( $t, $t['tile']['home'] ?? '' ) . "\n";
	echo '      <div class="gap" aria-hidden="true"></div>' . "\n";
	foreach ( $by( 'longevity' ) as $t ) echo '      ' . slim_tile( $t, $t['tile']['home'] ?? '' ) . "\n";
	$ask = (array) ( $P['ask'] ?? [] );
	echo '      <a class="el ask" href="#consult"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' . SLIM_ASK_ICON . '</svg><span class="sym">?</span><span><span class="nm">' . slim_t( $ask['nm'] ?? '' ) . '</span><br><span class="ft">' . slim_t( $ask['ft'] ?? '' ) . "</span></span></a>\n";
?>
    </div>
    <div class="legend"><span><b></b>Slimming</span><span><b class="l"></b>Longevity</span></div>
  </div>
</section>

<?php $vi = (array) ( $P['visit'] ?? [] ); ?>
<section class="sec" aria-labelledby="h-visit">
  <div class="wrap printout">
    <div>
      <h2 id="h-visit"><?php echo slim_t( $vi['h'] ?? '' ); ?></h2>
      <p class="lede" style="margin-top:20px"><?php echo slim_t( $vi['p'] ?? '' ); ?></p>
    </div>
    <div class="slip">
      <h3><?php echo slim_t( $vi['slipH'] ?? '' ); ?> <span><?php echo slim_t( $vi['slipTag'] ?? '' ); ?></span></h3>
      <ol>
<?php foreach ( (array) ( $vi['steps'] ?? [] ) as $s ) echo '        <li><b>' . slim_t( $s['b'] ) . '</b><span>' . slim_t( $s['s'] ) . "</span></li>\n"; ?>
      </ol>
      <div class="slip-foot"><span><?php echo slim_t( slim_set( 'siteName', 'Apex Slim and Longevity' ) ); ?></span><span><?php echo slim_t( slim_set( 'vary' ) ); ?></span></div>
    </div>
  </div>
</section>

<section class="sec longevity" id="longevity" aria-labelledby="h-long">
  <div class="wrap">
    <svg class="ecg" viewBox="0 0 1200 90" preserveAspectRatio="none" aria-hidden="true"><path d="M0 55H170L182 47 194 55H250L258 61 268 12 280 82 290 50H300L318 55H520L532 47 544 55H600L608 61 618 12 630 82 640 50H650L668 55H870L882 47 894 55H950L958 61 968 12 980 82 990 50H1000L1018 55H1200"/></svg>
    <div class="sec-head">
      <h2 id="h-long"><?php echo $g( 'longH', 'Longevity' ); ?></h2>
      <p><?php echo $g( 'longP' ); ?></p>
    </div>
    <div class="long-grid">
<?php foreach ( $by( 'longevity' ) as $t ) echo '      <a class="long-card" href="' . esc_url( $t['url'] ) . '"><span class="el' . ( $t['cls'] ? ' ' . esc_attr( $t['cls'] ) : '' ) . '"><span class="sym">' . slim_t( $t['sym'] ) . '</span></span><span><h3>' . slim_t( $t['name'] ) . '</h3><p>' . slim_t( $t['longCard'] ) . "</p></span></a>\n"; ?>
    </div>
  </div>
</section>
<?php if ( slim_has_cases() ) : ?>

<section class="sec rx-sec" id="results" aria-labelledby="h-results">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="h-results"><?php echo $g( 'resultsH', 'Results' ); ?></h2>
      <p><?php echo $g( 'resultsP' ); ?></p>
    </div>
    <div class="rx-picker" id="rx-picker" role="group" aria-label="Pick a case"></div>
    <div class="rx-frame" id="rx-frame">
      <div class="rx-stage" id="rx-stage" data-step="idle">
        <img class="rx-layer rx-start" src="<?php echo esc_url( slim_asset( 'img/results/run-start.webp' ) ); ?>" alt="The results pod" width="1600" height="1000">
        <video class="rx-layer rx-run" id="rx-run" muted playsinline preload="none" aria-hidden="true">
          <source src="<?php echo esc_url( slim_asset( 'video/results-run.webm' ) ); ?>" type="video/webm"><source src="<?php echo esc_url( slim_asset( 'video/results-run.mp4' ) ); ?>" type="video/mp4">
        </video>
        <div class="rx-map rx-photo" id="rx-photo"><img id="rx-photo-img" alt=""></div>
        <div class="rx-map rx-crown" id="rx-crown"><span id="rx-crown-text">Pick a case</span></div>
        <img class="rx-layer rx-term" src="<?php echo esc_url( slim_asset( 'img/results/terminal-end.webp' ) ); ?>" alt="" width="1600" height="1000" loading="lazy">
        <div class="rx-hud">
          <button class="rx-btn" type="button" id="rx-again" hidden>Run again</button>
        </div>
      </div>
      <div class="rx-panels" id="rx-panels" hidden>
        <div class="rx-panel rx-pl" data-w="366" data-h="500">
          <p class="rx-kick"><?php echo slim_t( slim_set( 'siteName', 'Apex Slim and Longevity' ) ); ?></p>
          <h3>Treatments</h3>
          <div class="rx-tx" id="rx-tx"></div>
          <h3>Cases</h3>
          <div class="rx-cases" id="rx-cases"></div>
        </div>
        <div class="rx-panel rx-pc" data-w="600" data-h="510">
          <div class="rx-pc-head"><h3 id="rx-title"></h3></div>
          <div class="rx-ba" role="button" tabindex="0" aria-label="See the before and after larger">
            <figure><img id="rx-before" alt=""><figcaption><b>Before</b><span id="rx-bdate"></span></figcaption></figure>
            <figure><img id="rx-after" alt=""><figcaption><b>After</b><span id="rx-adate"></span></figcaption></figure>
          </div>
        </div>
        <div class="rx-panel rx-pr" data-w="366" data-h="500">
          <h3 id="rx-vid-h">Patient video</h3>
          <div class="rx-vid" id="rx-vid"></div>
          <dl class="rx-facts" id="rx-facts"></dl>
          <p class="rx-vary">Results vary from person to person.</p>
        </div>
      </div>
    </div>
  </div>
</section>
<?php endif; ?>

<section class="sec" id="notes" aria-labelledby="h-notes">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="h-notes"><?php echo $g( 'notesH', 'Lab Notes' ); ?></h2>
      <p><?php echo $g( 'notesP' ); ?></p>
    </div>
    <div class="notes">
<?php
	foreach ( $txs as $t ) echo '      <a class="note" href="' . esc_url( $t['url'] ) . '"><span class="tagline"><b>' . slim_t( $t['sym'] ) . '</b>' . slim_read_mins( $t ) . ' min read</span><h3>' . slim_t( $t['note']['h'] ?? '' ) . '</h3><p>' . slim_t( $t['note']['p'] ?? '' ) . "</p></a>\n";
	$ln = (array) ( $P['labNote'] ?? [] );
	echo '      <a class="note" href="' . esc_url( $lab ) . '"><span class="tagline"><b>Lab</b>Tool</span><h3>' . slim_t( $ln['h'] ?? '' ) . '</h3><p>' . slim_t( $ln['p'] ?? '' ) . "</p></a>\n";
?>
    </div>
  </div>
</section>

<section class="sec" id="play" aria-labelledby="h-play">
  <div class="wrap">
    <div class="play">
      <div>
        <h2 id="h-play"><?php echo $g( 'playH' ); ?></h2>
        <p class="lede" style="margin-top:16px"><?php echo $g( 'playP' ); ?></p>
        <a class="btn" href="<?php echo esc_url( $lab ); ?>"><?php echo $g( 'playBtn', 'Open the lab' ); ?></a>
      </div>
      <svg class="dish" viewBox="0 0 180 180" aria-hidden="true"><circle cx="90" cy="90" r="84"/><circle cx="90" cy="90" r="74"/><circle cx="62" cy="70" r="9" fill="#C9B3DD" stroke="none"/><circle cx="108" cy="58" r="5" fill="#86D3BE" stroke="none"/><circle cx="118" cy="110" r="12" fill="#9CCBEA" stroke="none"/><circle cx="72" cy="118" r="6" fill="#A886CD" stroke="none"/><circle cx="96" cy="86" r="3" fill="#6A388C" stroke="none"/></svg>
    </div>
  </div>
</section>

<?php
	slim_consult( false );
}

/* ---------- lab ---------- */
function slim_view_lab(): void {
	$P = slim_page_vals( 'lab' );
	$g = fn( $k, $d = '' ) => slim_t( $P[ $k ] ?? $d );
	?>

<section class="lab-top" aria-labelledby="h-lab">
  <div class="wrap">
    <p class="crumbs"><a href="<?php echo esc_url( slim_home() ); ?>"><?php echo slim_t( slim_set( 'siteName', 'Apex Slim and Longevity' ) ); ?></a> / <?php echo $g( 'h1' ); ?></p>
    <h1 id="h-lab"><?php echo $g( 'h1' ); ?></h1>
    <p class="lede"><?php echo $g( 'lede' ); ?></p>
    <nav class="lab-jump" aria-label="Lab tools"><a href="#body-check">Body check</a><a href="#goal-photo">Goal photo</a><a href="#meals">Today's meals</a><span>Games coming soon</span></nav>
  </div>
</section>

<section class="sec bc" id="body-check" aria-labelledby="h-bc" style="padding-top:40px">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="h-bc">Body check</h2>
      <p><?php echo $g( 'bcP' ); ?></p>
    </div>
    <div class="bc-grid">
      <form class="form bc-form" id="bc-form" novalidate>
        <div class="form-head"><b>Your numbers</b><span>For adults 18 and over</span></div>
        <div class="form-body">
          <fieldset class="field">
            <legend>Body</legend>
            <div class="checks">
              <label><input type="radio" name="sex" value="female" checked><span>Female</span></label>
              <label><input type="radio" name="sex" value="male"><span>Male</span></label>
            </div>
          </fieldset>
          <div class="row3">
            <div class="field"><label for="bc-h">Height (cm)</label><input id="bc-h" aria-describedby="bc-msg" name="h" type="number" inputmode="decimal" min="120" max="220" placeholder="160"></div>
            <div class="field"><label for="bc-w">Weight (kg)</label><input id="bc-w" aria-describedby="bc-msg" name="w" type="number" inputmode="decimal" min="30" max="250" placeholder="62"></div>
            <div class="field"><label for="bc-waist">Waist (cm)</label><input id="bc-waist" aria-describedby="bc-msg" name="waist" type="number" inputmode="decimal" min="40" max="200" placeholder="82"></div>
          </div>
          <p class="bc-hint"><?php echo $g( 'bcHint' ); ?></p>
          <p class="form-msg" id="bc-msg" role="status"></p>
          <p class="sr-only" id="bc-live" aria-live="polite"></p>
        </div>
      </form>

      <div class="bc-scan" aria-labelledby="h-bc">
        <div class="bc-view">
          <canvas id="bc-canvas" aria-label="3D body built from your numbers" role="img"></canvas>
          <div class="bc-tabs" role="group" aria-label="Body shown">
            <button type="button" class="on" data-view="now" aria-pressed="true">Now</button>
            <button type="button" data-view="goal" aria-pressed="false">Goal</button>
          </div>
          <p class="bc-drag">Drag to turn</p>
        </div>
        <div class="bc-read">
          <div><span>BMI</span><b id="bc-bmi">–</b><i id="bc-cat">Enter your numbers</i></div>
          <div><span>Waist</span><b id="bc-wv">–</b><i id="bc-wcat"></i></div>
        </div>
        <p class="bc-note" id="bc-note"></p>
        <div class="bc-goal" id="bc-goal">
          <label for="bc-gw">Goal weight <b id="bc-gwv">59 kg</b></label>
          <input id="bc-gw" type="range" min="40" max="62" step="0.5" value="59">
          <p id="bc-gnote"></p>
        </div>
      </div>
    </div>

    <div class="bc-rx" aria-labelledby="h-bcrx">
      <h3 id="h-bcrx">Programs to ask the doctor about</h3>
      <div class="rx-list" id="bc-list"></div>
      <p class="bc-small"><?php echo $g( 'bcSmall' ); ?></p>
      <a class="btn" id="bc-book" href="<?php echo esc_url( slim_home() . '#consult' ); ?>">Book a consult with these</a>
    </div>
  </div>
</section>

<section class="sec gp" id="goal-photo" style="padding-top:0" aria-labelledby="h-gp">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="h-gp">Goal photo</h2>
      <p><?php echo $g( 'gpP' ); ?></p>
    </div>
    <div class="gp-grid">
      <div class="gp-ctrl">
        <div class="bc-tabs gp-mode" role="group" aria-label="Photo type">
          <button type="button" class="on" data-mode="face" aria-pressed="true">Face</button>
          <button type="button" data-mode="body" aria-pressed="false">Body</button>
        </div>
        <p class="gp-tip" id="gp-tip">Use a front photo with your whole face showing, looking straight at the camera.</p>
        <label class="btn gp-pick">Choose a photo<input type="file" id="gp-file" accept="image/*" hidden></label>
        <div class="gp-amount">
          <label for="gp-amt">Slimming <b id="gp-amtv">60%</b></label>
          <input type="range" id="gp-amt" min="0" max="100" step="5" value="60" disabled>
        </div>
        <div class="gp-acts">
          <button class="btn ghost" type="button" id="gp-hold" disabled>Hold to see before</button>
          <button class="btn ghost" type="button" id="gp-save" disabled>Save image</button>
        </div>
        <p class="gp-disc"><?php echo $g( 'gpDisc' ); ?></p>
      </div>
      <div class="gp-view">
        <canvas id="gp-canvas" width="900" height="1100" role="img" aria-label="Your goal photo"></canvas>
        <p class="gp-status" id="gp-status" role="status">Your goal photo shows here.</p>
      </div>
    </div>
  </div>
</section>

<section class="sec ml" id="meals" style="padding-top:0" aria-labelledby="h-ml">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="h-ml">Today's meals</h2>
      <p><?php echo $g( 'mlP' ); ?></p>
    </div>
    <div class="ml-top">
      <p class="ml-date" id="ml-date"></p>
      <button class="btn ghost" type="button" id="ml-next">Show another day</button>
    </div>
    <div class="ml-grid" id="ml-grid"></div>
    <div class="ml-plate">
      <svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="56" fill="#fff" stroke="#C9B3DD" stroke-width="3"/><path d="M60 60V8A52 52 0 0 0 60 112Z" fill="#86D3BE"/><path d="M60 60V112A52 52 0 0 0 112 60Z" fill="#F2E2A6"/><path d="M60 60H112A52 52 0 0 0 60 8Z" fill="#F07E7E"/></svg>
      <p><b>The 2:1:1 plate</b><?php echo $g( 'plate' ); ?></p>
    </div>
    <p class="bc-small"><?php echo $g( 'mlSmall' ); ?></p>
  </div>
</section>

<?php
}

/* ---------- treatment ---------- */
function slim_zoom( string $src, string $alt, string $set = '' ): string {
	return '<button type="button" class="zoomable" data-full="' . esc_url( slim_img( $src ) ) . '"' . ( $set ? ' data-set="' . esc_attr( $set ) . '"' : '' ) . '>' . slim_img_tag( $src, $alt ) . '</button>';
}
function slim_has( $g, string $list ): bool { return is_array( $g ) && ! empty( $g[ $list ] ); }

function slim_view_treatment( array $t ): void {
	$home = slim_home();
	$cls = $t['cls'] ? ' ' . esc_attr( $t['cls'] ) : '';
	$name = slim_t( $t['name'] );
	$icon = SLIM_ICONS[ $t['icon'] ?? '' ] ?? SLIM_ICONS[ $t['sym'] ] ?? SLIM_ICONS['Wk'];
	$temp = array_pad( (array) $t['temp'], 2, '' );
	$line = (array) slim_set( 'line', [] );
	$pair = slim_treatment_by( 'key', (string) ( $t['pair']['to'] ?? '' ) );
	$extra = ( $t['extra'] ?? '' ) === 'stages' ? (string) file_get_contents( SLIM_DIR . '/parts/stages.html' ) : '';
	$is_tx = $t['group'] === 'treatments';
	?>

<section class="tx-top" aria-labelledby="h-tx">
<div class="wrap">
<div class="specimen">
<div class="el<?php echo $cls; ?>" aria-hidden="true"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><?php echo $icon; ?></svg><span class="sym"><?php echo slim_t( $t['sym'] ); ?></span><span><span class="nm"><?php echo $name; ?></span><br><span class="ft"><?php echo slim_t( $t['tile']['page'] ?? '' ); ?></span></span></div>
<div class="temp"><span><?php echo slim_t( $temp[0] ); ?></span><span><?php echo slim_t( $temp[1] ); ?></span></div>
</div>
<div>
<p class="crumbs"><a href="<?php echo esc_url( $home . ( $is_tx ? '#treatments' : '#longevity' ) ); ?>"><?php echo $is_tx ? 'Treatments' : 'Longevity'; ?></a> / <?php echo $name; ?></p>
<h1 id="h-tx"><?php echo $name; ?></h1>
<?php foreach ( (array) $t['hook'] as $h ) echo '<p class="lede hook">' . slim_h( $h ) . "</p>\n"; ?>
<table class="protocol">
<caption class="sr-only"><?php echo $name; ?> at a glance</caption>
<?php foreach ( (array) $t['protocol'] as $r ) echo '<tr><th scope="row">' . slim_t( $r['k'] ) . '</th><td>' . slim_h( $r['v'] ) . "</td></tr>\n"; ?>
</table>
<div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:32px">
<a class="btn" href="#consult">Book a consult</a>
<?php if ( ! empty( $line['url'] ) ) echo '<a class="btn ghost" href="' . esc_url( $line['url'] ) . '" target="_blank" rel="noopener">Chat on LINE</a>' . "\n"; ?>
</div>
</div>
</div>
</section>

<?php echo $extra; ?>
<section class="sec" id="article"<?php echo $extra ? ' style="padding-top:0"' : ''; ?> aria-label="Article">
<div class="wrap article">
<div class="prose">
<?php
	$dev = (array) ( $t['device'] ?? [] );
	if ( ! empty( $dev['src'] ) ) echo '<figure class="tx-device">' . slim_img_tag( $dev['src'], (string) ( $dev['cap'] ?? '' ) ) . '<figcaption>' . slim_t( $dev['cap'] ?? '' ) . "</figcaption></figure>\n";
	// the classic editor drops <p> tags and WordPress adds them back on the page, as the_content does
	echo trim( wpautop( (string) $t['body'] ) ) . "\n";
	if ( $t['faq'] ) {
		echo "\n<h2>Questions</h2>\n<div class=\"faq\">\n";
		foreach ( (array) $t['faq'] as $r ) echo "<details name='faq'><summary>" . slim_t( $r['q'] ) . '</summary><p>' . slim_h( $r['a'] ) . "</p></details>\n";
		echo "</div>\n";
	}
	if ( $t['refs'] ) {
		echo "\n<h2 class=\"refs-h\">Sources</h2>\n<ol class=\"refs\">\n";
		foreach ( (array) $t['refs'] as $r ) echo '<li>' . slim_h( $r ) . "</li>\n";
		echo "</ol>\n";
	}
?>
<p class="note-mark">Results vary from person to person. The doctor checks whether a treatment suits you at your consult.</p>
</div>
<div class="side">
<aside class="aside" aria-labelledby="h-pair">
<h3 id="h-pair">Pairs with</h3>
<?php if ( $pair ) : ?>
<div class="chem"><a class="mini<?php echo $cls; ?>" href="<?php echo esc_url( $t['url'] ); ?>"><b><?php echo slim_t( $t['sym'] ); ?></b><small><?php echo $name; ?></small></a><span class="plus" aria-hidden="true">+</span><a class="mini<?php echo $pair['cls'] ? ' ' . esc_attr( $pair['cls'] ) : ''; ?>" href="<?php echo esc_url( $pair['url'] ); ?>"><b><?php echo slim_t( $pair['sym'] ); ?></b><small><?php echo slim_t( $pair['name'] ); ?></small></a></div>
<p style="color:var(--ink-2)"><?php echo slim_h( $t['pair']['text'] ?? '' ); ?></p>
<?php endif; ?>
<a class="btn" href="#consult" style="width:100%">Book a consult</a>
</aside>
<?php echo slim_banners( $t ); ?>
</div>
</div>
</section>
<?php
	echo slim_areas( $t ) . slim_plan( $t ) . slim_people( $t ) . slim_reviews( $t ) . slim_gallery( $t ) . slim_leaflets( $t );
	echo "\n";
	slim_consult( true, (string) $t['goal'] );
}

function slim_sec( string $cls, string $id, string $title, string $note, string $inner ): string {
	return "\n<section class=\"sec $cls\" aria-labelledby=\"$id\">\n<div class=\"wrap\">\n<div class=\"sec-head\"><h2 id=\"$id\">" . slim_t( $title ) . '</h2><p>' . slim_h( $note ) . "</p></div>\n$inner\n</div>\n</section>\n";
}

function slim_banners( array $t ): string {
	$out = []; $more = null;
	if ( slim_has( $t['reviews'], 'items' ) ) {
		foreach ( $t['reviews']['items'] as $r ) {
			$first = rtrim( explode( '. ', (string) $r['q'] )[0], '.' ) . '.';
			$role = ( $r['role'] ?? '' ) !== '' ? ', ' . mb_strtolower( $r['role'] ) : '';
			$out[] = '<a class="bn bn-rev" href="#h-reviews">' . slim_img_tag( (string) $r['face'], '' ) . '<span class="bn-kick">Review</span><q>' . slim_t( $first ) . '</q><span class="bn-name">' . slim_t( $r['en'] . $role ) . '</span></a>';
		}
		$more = [ '#h-reviews', 'Read all ' . slim_count_word( count( $t['reviews']['items'] ) ) . ' reviews' ];
	} elseif ( slim_has( $t['people'], 'items' ) ) {
		foreach ( $t['people']['items'] as $p ) $out[] = '<a class="bn bn-person" href="#h-people">' . slim_img_tag( (string) $p['src'], '' ) . '<span class="bn-kick">Our client</span><span class="bn-name">' . slim_t( $p['en'] ) . ' <span lang="th">' . slim_t( $p['th'] ) . '</span></span></a>';
	} elseif ( slim_has( $t['gallery'], 'cases' ) ) {
		foreach ( array_slice( $t['gallery']['cases'], 0, 4 ) as $c ) {
			$cells = (array) ( $c['cells'] ?? [] );
			if ( ! $cells ) continue;
			$b4 = $cells[0]; $af = $cells[ count( $cells ) - 1 ];
			$sub = ( $c['sub'] ?? '' ) !== '' ? '<span class="bn-sub">' . slim_t( $c['sub'] ) . '</span>' : '';
			$out[] = '<a class="bn bn-case" href="#h-cases"><span class="bn-kick">Before and after</span><span class="bn-pair">' . slim_img_tag( (string) $b4['src'], '' ) . slim_img_tag( (string) $af['src'], '' ) . '</span><span class="bn-name">' . slim_t( $c['label'] ) . '</span>' . $sub . '<span class="bn-sub">' . slim_t( $af['cap'] ) . '</span></a>';
		}
		$more = [ '#h-cases', 'See all the cases' ];
	} elseif ( $t['leaflets'] ) {
		foreach ( $t['leaflets'] as $l ) $out[] = '<a class="bn bn-leaf" href="#h-leaflets">' . slim_img_tag( (string) ( $l['thumb'] ?: $l['full'] ), '' ) . '<span class="bn-name">' . slim_t( $l['alt'] ) . '</span></a>';
	}
	if ( ! $out ) return '';
	$tail = $more ? '<a class="bn-more" href="' . $more[0] . '">' . slim_t( $more[1] ) . '</a>' : '';
	return '<div class="banners" aria-label="From this page">' . implode( '', $out ) . $tail . '</div>';
}
function slim_count_word( int $n ): string {
	return [ 2 => 'two', 3 => 'three', 4 => 'four', 5 => 'five', 6 => 'six' ][ $n ] ?? (string) $n;
}

function slim_gallery( array $t ): string {
	$g = $t['gallery'];
	if ( ! slim_has( $g, 'cases' ) ) return '';
	$cases = [];
	foreach ( $g['cases'] as $c ) {
		$cells = (array) ( $c['cells'] ?? [] );
		$sub = ( $c['sub'] ?? '' ) !== '' ? '<p class="tx-case-sub">' . slim_t( $c['sub'] ) . '</p>' : '';
		$figs = '';
		foreach ( $cells as $x ) $figs .= '<figure>' . slim_zoom( (string) $x['src'], $c['label'] . ', ' . mb_strtolower( $x['cap'] ) ) . '<figcaption>' . slim_t( $x['cap'] ) . '</figcaption></figure>';
		$n = count( $cells ) === 4 ? 2 : count( $cells );
		$cases[] = '<div class="tx-case" style="--n:' . $n . '"><h3>' . slim_t( $c['label'] ) . '</h3>' . $sub . '<div class="tx-cells">' . $figs . '</div></div>';
	}
	return slim_sec( 'tx-gallery', 'h-cases', (string) $g['title'], (string) $g['note'], "<div class=\"tx-cases\">\n" . implode( "\n", $cases ) . "\n</div>" );
}

function slim_areas( array $t ): string {
	$a = $t['areas'];
	if ( ! slim_has( $a, 'items' ) ) return '';
	$cards = '';
	foreach ( $a['items'] as $r ) {
		$imgs = (array) $r['imgs'];
		$alt = 'Where the applicator goes on the ' . mb_strtolower( $r['name'] );
		$pics = '';
		foreach ( $imgs as $f ) $pics .= slim_zoom( $f, $alt, 'areas' );
		$note = ( $r['note'] ?? '' ) !== '' ? '<p class="tx-area-note">' . slim_t( $r['note'] ) . '</p>' : '';
		$cards .= '<li class="tx-area"><div class="tx-area-pics' . ( count( $imgs ) > 1 ? ' two' : '' ) . '">' . $pics . '</div><h3>' . slim_t( $r['name'] ) . '</h3><p><b>' . slim_t( $r['cycles'] ) . '</b> cycles</p>' . $note . '</li>';
	}
	$map = '';
	if ( (string) $a['map'] === SLIM_MAP_FILE ) {
		$map = '<figure class="tx-map"><svg viewBox="0 30 734 750" role="img" aria-label="Body map of the CoolSculpting areas"><image href="' . esc_url( slim_img( SLIM_MAP_FILE ) ) . '" x="0" y="0" width="734" height="801"/>' . SLIM_MAP_LABELS . '</svg></figure>' . "\n";
	} elseif ( (string) $a['map'] !== '' ) {
		$map = '<figure class="tx-map">' . slim_img_tag( (string) $a['map'], 'Body map of the areas' ) . "</figure>\n";
	}
	return slim_sec( 'tx-areas', 'h-areas', (string) ( $a['title'] ?: 'Areas and cycles' ), (string) $a['intro'], $map . '<ul class="tx-area-grid">' . $cards . '</ul>' );
}

function slim_plan( array $t ): string {
	$pl = $t['plan'];
	if ( ! slim_has( $pl, 'groups' ) ) return '';
	$groups = '';
	foreach ( $pl['groups'] as $g ) {
		$cells = (array) ( $g['cells'] ?? [] );
		$figs = '';
		foreach ( $cells as $x ) $figs .= '<figure>' . slim_zoom( (string) $x['src'], (string) $x['cap'], 'plan' ) . '<figcaption>' . slim_t( $x['cap'] ) . '</figcaption></figure>';
		$groups .= '<div class="tx-plan-group"><h3>' . slim_t( $g['h'] ) . '</h3><p>' . slim_h( $g['text'] ) . '</p><div class="tx-plan-row" style="--n:' . count( $cells ) . '">' . $figs . '</div></div>';
	}
	return slim_sec( 'tx-plan', 'h-plan', (string) $pl['title'], (string) $pl['intro'], $groups . "\n<p class=\"tx-credit\">" . slim_h( $pl['credit'] ) . '</p>' );
}

function slim_people( array $t ): string {
	$pp = $t['people'];
	if ( ! slim_has( $pp, 'items' ) ) return '';
	$figs = '';
	foreach ( $pp['items'] as $p ) $figs .= '<figure>' . slim_zoom( (string) $p['src'], (string) $p['en'], 'people' ) . '<figcaption>' . slim_t( $p['en'] ) . ' <span lang="th">' . slim_t( $p['th'] ) . '</span></figcaption></figure>';
	return slim_sec( 'tx-people', 'h-people', (string) $pp['title'], (string) $pp['note'], '<div class="tx-people-row">' . $figs . '</div>' );
}

function slim_reviews( array $t ): string {
	$rv = $t['reviews'];
	if ( ! slim_has( $rv, 'items' ) ) return '';
	$cards = '';
	foreach ( $rv['items'] as $r ) {
		$role = ( $r['role'] ?? '' ) !== '' ? '<span class="tx-rev-role">' . slim_t( $r['role'] ) . '</span>' : '';
		$cards .= '<li class="tx-rev"><div class="tx-rev-pics">' . slim_zoom( (string) $r['face'], (string) $r['en'], 'reviews' ) . slim_zoom( (string) $r['tx'], $r['en'] . ' during ' . $t['name'], 'reviews' ) . '</div>'
			. '<blockquote><p>' . slim_t( $r['q'] ) . '</p><p class="tx-rev-th" lang="th">' . slim_t( $r['qth'] ) . '</p></blockquote>'
			. '<p class="tx-rev-name">' . slim_t( $r['en'] ) . ' <span lang="th">' . slim_t( $r['th'] ) . '</span>' . $role . '</p></li>';
	}
	return slim_sec( 'tx-reviews', 'h-reviews', (string) $rv['title'], (string) $rv['note'], '<ul class="tx-rev-grid">' . $cards . '</ul>' );
}

function slim_leaflets( array $t ): string {
	if ( ! $t['leaflets'] ) return '';
	$items = '';
	foreach ( $t['leaflets'] as $l ) $items .= '<li><button type="button" class="zoomable" data-full="' . esc_url( slim_img( (string) $l['full'] ) ) . '" data-set="leaflets">' . slim_img_tag( (string) ( $l['thumb'] ?: $l['full'] ), (string) $l['alt'] ) . '</button></li>';
	return slim_sec( 'tx-leaflets', 'h-leaflets', 'Brochures', 'Our ' . esc_html( $t['name'] ) . ' brochures, in Thai. Tap one to see it full size.', '<ul class="leaflet-row">' . $items . '</ul>' );
}

/* ---------- other pages ---------- */
function slim_view_page(): void {
	$p = get_queried_object();
	?>

<section class="lab-top" aria-labelledby="h-page">
  <div class="wrap">
    <p class="crumbs"><a href="<?php echo esc_url( slim_home() ); ?>"><?php echo slim_t( slim_set( 'siteName', 'Apex Slim and Longevity' ) ); ?></a> / <?php echo slim_t( get_the_title( $p ) ); ?></p>
    <h1 id="h-page"><?php echo slim_t( get_the_title( $p ) ); ?></h1>
  </div>
</section>

<section class="sec" style="padding-top:24px" aria-label="Page">
  <div class="wrap"><div class="prose page-text">
<?php echo apply_filters( 'the_content', $p->post_content ); ?>
  </div></div>
</section>

<?php
}

function slim_view_404(): void {
	?>

<section class="lab-top" aria-labelledby="h-404">
  <div class="wrap">
    <h1 id="h-404">Page not found</h1>
    <p class="lede">The page may have moved. The main parts of the site are here.</p>
    <nav class="lab-jump" aria-label="Main parts"><a href="<?php echo esc_url( slim_home() ); ?>">Home</a><?php foreach ( slim_treatments() as $t ) echo '<a href="' . esc_url( $t['url'] ) . '">' . slim_t( $t['name'] ) . '</a>'; ?><a href="<?php echo esc_url( slim_lab_url() ); ?>">Slim Wellness Lab</a></nav>
  </div>
</section>

<?php
}

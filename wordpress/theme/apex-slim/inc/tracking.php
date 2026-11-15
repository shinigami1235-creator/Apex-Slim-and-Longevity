<?php
/**
 * Google Tag Manager with Google Consent Mode v2, and the cookie banner Thai PDPA asks for.
 * Nothing that stores analytics or advertising cookies runs until the visitor accepts; Tag Manager loads
 * straight away with everything denied, so tags that respect consent (GA4, Google Ads) wait for the choice.
 * The site's own events (consult:submit from the form) go to the same dataLayer.
 * Apex Slim › Tracking and code sets the container ID; empty turns tracking off.
 * The same page holds custom code: boxes printed as typed in the head, after <body>, before </body>, plus
 * custom CSS and JavaScript. Only someone allowed to post raw HTML (an administrator) can change them.
 */
defined( 'ABSPATH' ) || exit;

function slim_gtm_id(): string {
	$v = get_option( 'slim_gtm', '' );
	return preg_match( '/^GTM-[A-Z0-9]{4,12}$/', (string) $v ) ? $v : '';
}

/* consent defaults and the container, first thing in the head */
add_action( 'wp_head', function () {
	$id = slim_gtm_id();
	if ( is_admin() || ! $id ) return;   // no container: nothing from Google loads
	?>
<script>
window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
(function(){var c=null;try{c=JSON.parse(localStorage.getItem('slim_consent')||'null');}catch(e){}
var g=c&&c.v===1?c:null,a=g&&g.analytics?'granted':'denied',m=g&&g.ads?'granted':'denied';
gtag('consent','default',{ad_storage:m,ad_user_data:m,ad_personalization:m,analytics_storage:a,functionality_storage:'granted',security_storage:'granted',wait_for_update:500});
gtag('set','ads_data_redaction',m==='denied');gtag('set','url_passthrough',true);})();
</script>
<?php if ( $id ) : ?>
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','<?php echo esc_js( $id ); ?>');</script>
<?php endif;
}, 1 );
add_action( 'wp_body_open', function () {
	$id = slim_gtm_id();
	if ( $id ) echo '<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=' . esc_attr( $id ) . '" height="0" width="0" style="display:none;visibility:hidden" title="Google Tag Manager"></iframe></noscript>';
} );

/* the banner: shown until the visitor chooses; "Cookie settings" in the footer brings it back */
add_action( 'wp_footer', function () {
	if ( is_admin() || ! slim_gtm_id() ) return;   // no container, no tags, no banner
	$t = [
		'h' => 'Cookies on this site',
		'p' => 'We use the cookies the site needs to work. With your permission we also use analytics cookies to improve the site and advertising cookies to measure our ads. You can change your mind any time under "Cookie settings" at the foot of the page.',
		'all' => 'Accept all', 'none' => 'Only necessary', 'set' => 'Choose', 'save' => 'Save',
		'an' => 'Analytics cookies', 'anP' => 'Count visits and the pages people open',
		'ad' => 'Advertising cookies', 'adP' => 'Measure our ads on Google and Facebook',
		'link' => 'Cookie settings',
	];
	?>
<div class="ck" id="slim-ck" role="dialog" aria-modal="false" aria-labelledby="slim-ck-h" hidden>
  <div class="ck-in"><p class="ck-h" id="slim-ck-h"><?php echo esc_html( $t['h'] ); ?></p><p class="ck-p"><?php echo esc_html( $t['p'] ); ?></p>
  <div class="ck-opts" hidden><label><input type="checkbox" name="analytics"> <b><?php echo esc_html( $t['an'] ); ?></b><small><?php echo esc_html( $t['anP'] ); ?></small></label><label><input type="checkbox" name="ads"> <b><?php echo esc_html( $t['ad'] ); ?></b><small><?php echo esc_html( $t['adP'] ); ?></small></label></div>
  <div class="ck-acts"><button type="button" class="btn" data-ck="all"><?php echo esc_html( $t['all'] ); ?></button><button type="button" class="btn ghost" data-ck="none"><?php echo esc_html( $t['none'] ); ?></button><button type="button" class="ck-set" data-ck="set"><?php echo esc_html( $t['set'] ); ?></button><button type="button" class="btn" data-ck="save" hidden><?php echo esc_html( $t['save'] ); ?></button></div></div>
</div>
<style>
.ck{position:fixed;z-index:120;left:16px;right:16px;bottom:16px;max-width:560px;background:#fff;color:var(--ink,#2A1F33);border-radius:22px;box-shadow:0 18px 60px rgba(31,10,48,.28);border:1px solid var(--lilac-200,#E4D8EE)}
.ck [hidden]{display:none!important}
.ck-in{padding:20px 22px}.ck-h{font-weight:800;font-size:17px;margin:0 0 6px}.ck-p{font-size:14px;line-height:1.55;margin:0 0 14px;color:var(--ink-2,#5A4A66)}
.ck-acts{display:flex;flex-wrap:wrap;gap:10px;align-items:center}.ck-set{background:none;border:0;padding:8px 4px;font:inherit;font-size:14px;font-weight:700;color:var(--plum,#6A388C);text-decoration:underline;cursor:pointer}
.ck-opts{display:grid;gap:10px;margin:0 0 14px}.ck-opts label{display:grid;grid-template-columns:22px 1fr;column-gap:8px;font-size:14px;cursor:pointer}.ck-opts small{grid-column:2;color:var(--ink-2,#5A4A66)}
.ck-opts input{width:18px;height:18px;margin:2px 0 0;accent-color:var(--plum,#6A388C)}
.ck-link{background:none;border:0;padding:0 6px;font:inherit;color:inherit;text-decoration:underline;cursor:pointer;opacity:.8}
@media (max-width:520px){.ck{left:10px;right:10px;bottom:10px}.ck-acts .btn{flex:1 1 auto;justify-content:center}}
</style>
<script>
(function(){
  var box=document.getElementById('slim-ck'); if(!box) return;
  var K='slim_consent', opts=box.querySelector('.ck-opts'), save=box.querySelector('[data-ck=save]'), set=box.querySelector('[data-ck=set]');
  function read(){try{var c=JSON.parse(localStorage.getItem(K)||'null');return c&&c.v===1?c:null;}catch(e){return null;}}
  function write(a,m){var c={v:1,analytics:!!a,ads:!!m,at:Date.now()};try{localStorage.setItem(K,JSON.stringify(c));}catch(e){}
    document.cookie='slim_consent='+(a?'a':'')+(m?'m':'')+'-;path=/;max-age=15552000;SameSite=Lax';
    gtag('consent','update',{analytics_storage:a?'granted':'denied',ad_storage:m?'granted':'denied',ad_user_data:m?'granted':'denied',ad_personalization:m?'granted':'denied'});
    gtag('set','ads_data_redaction',!m);
    window.dataLayer.push({event:'slim_consent',slim:{analytics:!!a,ads:!!m}});
    try{window.dispatchEvent(new CustomEvent('slim:consent',{detail:c}));}catch(e){}
    box.hidden=true;}
  function open(){var c=read();box.hidden=false;opts.hidden=true;save.hidden=true;set.hidden=false;
    box.querySelector('[name=analytics]').checked=!!(c&&c.analytics);box.querySelector('[name=ads]').checked=!!(c&&c.ads);}
  box.addEventListener('click',function(e){var b=e.target.closest('[data-ck]');if(!b)return;var k=b.getAttribute('data-ck');
    if(k==='all')write(1,1);else if(k==='none')write(0,0);
    else if(k==='set'){opts.hidden=false;save.hidden=false;set.hidden=true;box.querySelector('[name=analytics]').focus();}
    else if(k==='save')write(box.querySelector('[name=analytics]').checked,box.querySelector('[name=ads]').checked);});
  // the banner waits for the site font (at most 1.2 s), so its height does not change under the reader and push its own text
  if(!read()){var go=function(){open();};var t='a',f=document.fonts&&document.fonts.load?Promise.all([document.fonts.load('400 16px "LINE Seed"',t),document.fonts.load('800 16px "LINE Seed"',t)]):null;
    f?Promise.race([f,new Promise(function(r){setTimeout(r,1200);})]).then(go,go):go();}
  function link(){var f=document.querySelector('.foot .wrap > div');if(!f||document.querySelector('.ck-link'))return;
    var w=document.createElement('span'),a=document.createElement('button');w.className='ck-wrap';a.type='button';a.className='ck-link';a.textContent=<?php echo wp_json_encode( $t['link'], JSON_UNESCAPED_UNICODE ); ?>;a.addEventListener('click',open);w.append(document.createElement('br'),a);f.append(w);}
  if(document.readyState!=='loading')link();else document.addEventListener('DOMContentLoaded',link);
})();
</script>
<?php
}, 50 );

/* ---------- custom code ---------- */
const SLIM_CODE = [ 'head', 'body', 'footer', 'css', 'js' ];
function slim_code( string $k ): string { $v = get_option( 'slim_code_' . $k, '' ); return is_string( $v ) ? $v : ''; }
add_action( 'wp_head', function () {
	if ( is_admin() ) return;
	if ( ( $c = slim_code( 'css' ) ) !== '' ) echo "<style id=\"slim-custom-css\">\n" . str_ireplace( '</style', '<\\/style', $c ) . "\n</style>\n";
	if ( ( $c = slim_code( 'head' ) ) !== '' ) echo $c . "\n";
}, 99 );
add_action( 'wp_body_open', function () { if ( ( $c = slim_code( 'body' ) ) !== '' ) echo $c . "\n"; }, 20 );
add_action( 'wp_footer', function () {
	if ( is_admin() ) return;
	if ( ( $c = slim_code( 'footer' ) ) !== '' ) echo $c . "\n";
	if ( ( $c = slim_code( 'js' ) ) !== '' ) echo "<script id=\"slim-custom-js\">\n" . str_ireplace( '</script', '<\\/script', $c ) . "\n</script>\n";
}, 99 );

/* Apex Slim › Tracking and code */
add_action( 'admin_menu', function () {
	add_submenu_page( 'slim-settings', __( 'Tracking and code', 'slim' ), __( 'Tracking and code', 'slim' ), 'manage_options', 'slim-tracking', function () {
		if ( ! current_user_can( 'manage_options' ) ) return;
		if ( isset( $_POST['slim_gtm_nonce'] ) && wp_verify_nonce( sanitize_key( $_POST['slim_gtm_nonce'] ), 'slim_gtm' ) ) {
			$v = strtoupper( sanitize_text_field( wp_unslash( $_POST['slim_gtm'] ?? '' ) ) );
			update_option( 'slim_gtm', preg_match( '/^GTM-[A-Z0-9]{4,12}$/', $v ) ? $v : '', true );
			$changed = [];
			if ( current_user_can( 'unfiltered_html' ) ) foreach ( SLIM_CODE as $k ) {
				$new = (string) wp_unslash( $_POST[ 'slim_code_' . $k ] ?? '' );
				if ( $new !== slim_code( $k ) ) $changed[] = $k;
				update_option( 'slim_code_' . $k, $new, true );
			}
			slim_audit( 'settings', 0, 'Tracking and code' . ( $changed ? ' (custom code: ' . implode( ', ', $changed ) . ')' : '' ) );
			echo '<div class="notice notice-success"><p>' . esc_html__( 'Saved.', 'slim' ) . '</p></div>';
		}
		echo '<div class="wrap"><h1>' . esc_html__( 'Tracking and code', 'slim' ) . '</h1><form method="post"><table class="form-table"><tr><th><label for="slim-gtm">' . esc_html__( 'Google Tag Manager container', 'slim' ) . '</label></th><td><input id="slim-gtm" name="slim_gtm" class="regular-text" value="' . esc_attr( slim_gtm_id() ) . '" placeholder="GTM-XXXXXXX"><p class="description">' . esc_html__( 'Empty turns Tag Manager off. Analytics and ads tags in the container must use Consent Mode: they only store cookies after the visitor accepts in the cookie banner.', 'slim' ) . '</p></td></tr></table>';
		$boxes = [
			'head' => [ __( 'Code in the head', 'slim' ), __( 'Printed as typed before </head> on every page: verification meta tags, a font, a script a vendor gives you.', 'slim' ) ],
			'body' => [ __( 'Code after <body>', 'slim' ), __( 'Printed right after the <body> tag. Some vendors ask for a noscript tag here.', 'slim' ) ],
			'footer' => [ __( 'Code before </body>', 'slim' ), __( 'Printed at the end of every page: chat widgets and other scripts that can load last.', 'slim' ) ],
			'css' => [ __( 'Custom CSS', 'slim' ), __( 'Plain CSS without the <style> tag. It loads after the theme\'s styles, so it wins.', 'slim' ) ],
			'js' => [ __( 'Custom JavaScript', 'slim' ), __( 'Plain JavaScript without the <script> tag. Runs at the end of every page.', 'slim' ) ],
		];
		$can = current_user_can( 'unfiltered_html' );
		echo '<h2>' . esc_html__( 'Custom code', 'slim' ) . '</h2><p>' . esc_html__( 'Code here runs on every page of the site without asking for cookie consent. Put analytics and ad pixels in Tag Manager instead, so the cookie banner controls them. A mistake here can break the site: test on staging first.', 'slim' ) . '</p>';
		if ( ! $can ) echo '<p><b>' . esc_html__( 'Only an administrator who may post raw HTML can change these boxes.', 'slim' ) . '</b></p>';
		echo '<table class="form-table">';
		foreach ( $boxes as $k => [ $label, $help ] ) echo '<tr><th><label for="slim-code-' . $k . '">' . esc_html( $label ) . '</label></th><td><textarea id="slim-code-' . $k . '" name="slim_code_' . $k . '" class="large-text code" rows="6" spellcheck="false"' . ( $can ? '' : ' readonly' ) . '>' . esc_textarea( slim_code( $k ) ) . '</textarea><p class="description">' . esc_html( $help ) . '</p></td></tr>';
		echo '</table>';
		wp_nonce_field( 'slim_gtm', 'slim_gtm_nonce' );
		submit_button();
		echo '<h2>' . esc_html__( 'Events the site sends', 'slim' ) . '</h2><p>' . esc_html__( 'A sent consult request pushes the event consult:submit to the dataLayer. Use it as the conversion trigger in Tag Manager.', 'slim' ) . '</p></form></div>';
	} );
} );

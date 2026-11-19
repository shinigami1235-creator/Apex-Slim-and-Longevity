<?php
/**
 * The fields of every content type. The admin forms (inc/fields.php), the importer (inc/io.php) and the
 * templates (inc/data.php) all read these lists, so a field added here shows up in all three.
 *
 * Field types:
 *   text, textarea   plain text
 *   html             text that may hold links, bold and italics (sources, answers, protocol values)
 *   hlines           one html item per line (opening paragraphs, sources)
 *   lines            one plain item per line
 *   url, image       an address; image adds the media picker
 *   scalars          several pictures, one per line, with the media picker
 *   number, bool, select
 *   txpick           tick the treatments by symbol
 *   group            fields kept together
 *   repeater         rows of the same fields, added, removed and moved in the admin
 *   content          the WordPress editor box (the treatment article, the privacy policy)
 * A field with 'src' is WordPress's own box (title, slug, order); 'hidden' keeps a value the form does not show.
 */
defined( 'ABSPATH' ) || exit;

function slim_f( string $k, string $t, string $l, array $more = [] ): array {
	return [ 'k' => $k, 't' => $t, 'l' => $l ] + $more;
}

/** Choices for "Pairs with": every treatment by its address. */
function slim_tx_options(): array {
	$o = [ '' => '—' ];
	foreach ( get_posts( [ 'post_type' => 'slim_treatment', 'post_status' => [ 'publish', 'draft', 'private' ], 'numberposts' => 100, 'orderby' => 'menu_order', 'order' => 'ASC', 'no_found_rows' => true ] ) as $p ) $o[ $p->post_name ] = $p->post_title;
	return $o;
}

function slim_schema( string $which ): array {
	$cells = slim_f( 'cells', 'repeater', 'Pictures', [ 'f' => [ slim_f( 'src', 'image', 'Picture' ), slim_f( 'cap', 'text', 'Caption', [ 'h' => 'Shown under the picture, like "Before" or "After 2 sessions".' ] ) ] ] );
	switch ( $which ) {
		case 'slim_treatment':
			return [
				slim_f( 'name', 'text', 'Name', [ 'src' => 'title' ] ),
				slim_f( 'key', 'text', 'Address', [ 'src' => 'slug' ] ),
				slim_f( 'order', 'number', 'Order', [ 'src' => 'order' ] ),
				slim_f( 'body', 'content', 'Article', [ 'h' => 'The article under the top of the page, written in the editor above. Use the Text tab to keep the figures and boxes as they are.' ] ),
				slim_f( 'sym', 'text', 'Symbol', [ 'h' => 'Two letters, first one capital, like Cs. Shown on the tile and used by the mixing bench and the body check.' ] ),
				slim_f( 'icon', 'select', 'Icon', [ 'o' => SLIM_ICON_NAMES ] ),
				slim_f( 'group', 'select', 'Section', [ 'o' => [ 'treatments' => 'Treatments (slimming)', 'longevity' => 'Longevity' ] ] ),
				slim_f( 'cls', 'select', 'Tile colour', [ 'o' => [ '' => 'Purple', 'cold' => 'Blue (cold)', 'long' => 'Green (longevity)' ] ] ),
				slim_f( 'goal', 'select', 'Goal on the mixing bench', [ 'o' => SLIM_GOALS, 'h' => 'The bottle that leads to this treatment, and the goal ticked on its consult form.' ] ),
				slim_f( 'tile', 'group', 'Tile', [ 'f' => [
					slim_f( 'home', 'text', 'Line on the home page tile', [ 'h' => 'Like "35 to 75 min per area".' ] ),
					slim_f( 'page', 'text', 'Line on this page\'s tile', [ 'h' => 'Like "CoolSculpting Elite fat freezing".' ] ),
				] ] ),
				slim_f( 'temp', 'lines', 'Labels beside the tile', [ 'h' => 'Two lines, like "Slimming" and "No needles, no cuts".' ] ),
				slim_f( 'bench', 'group', 'Mixing bench and body check card', [ 'f' => [
					slim_f( 'time', 'text', 'Time', [ 'h' => 'Like "35 to 75 min per area".' ] ),
					slim_f( 'desc', 'textarea', 'One line on what it does' ),
				] ] ),
				slim_f( 'longCard', 'textarea', 'Card in the Longevity section', [ 'h' => 'Only for treatments in the Longevity section.' ] ),
				slim_f( 'note', 'group', 'Lab Notes card on the home page', [ 'f' => [
					slim_f( 'h', 'text', 'Heading', [ 'h' => 'Like "How cold removes fat cells".' ] ),
					slim_f( 'p', 'textarea', 'Line under it' ),
				] ] ),
				slim_f( 'desc', 'textarea', 'Search description', [ 'h' => 'What Google shows under the page title. About 150 characters.' ] ),
				slim_f( 'hook', 'hlines', 'Opening paragraphs', [ 'h' => 'One paragraph per line, under the page heading.' ] ),
				slim_f( 'protocol', 'repeater', 'At a glance', [ 'f' => [ slim_f( 'k', 'text', 'Label', [ 'h' => 'Like "Session time".' ] ), slim_f( 'v', 'html', 'Value' ) ] ] ),
				slim_f( 'extra', 'select', 'Extra section under the top', [ 'o' => [ '' => 'None', 'stages' => 'How cold removes fat cells (the CoolSculpting stages)' ] ] ),
				slim_f( 'faq', 'repeater', 'Questions', [ 'f' => [ slim_f( 'q', 'text', 'Question' ), slim_f( 'a', 'html', 'Answer' ) ] ] ),
				slim_f( 'refs', 'hlines', 'Sources', [ 'h' => 'One source per line. Links are kept.' ] ),
				slim_f( 'pair', 'group', 'Pairs with', [ 'f' => [ slim_f( 'to', 'select', 'Treatment', [ 'o' => 'slim_tx_options', 'keep' => true ] ), slim_f( 'text', 'html', 'Why they go together' ) ] ] ),
				slim_f( 'device', 'group', 'Machine photo', [ 'h' => 'Shown at the top of the article.', 'f' => [ slim_f( 'src', 'image', 'Photo' ), slim_f( 'cap', 'text', 'Caption' ) ] ] ),
				slim_f( 'gallery', 'group', 'Before and after cases', [ 'f' => [
					slim_f( 'title', 'text', 'Section heading' ), slim_f( 'note', 'html', 'Line under the heading' ),
					slim_f( 'cases', 'repeater', 'Cases', [ 'f' => [ slim_f( 'label', 'text', 'Case' ), slim_f( 'sub', 'text', 'Line under it' ), $cells ] ] ),
				] ] ),
				slim_f( 'areas', 'group', 'Areas and cycles', [ 'f' => [
					slim_f( 'title', 'text', 'Section heading' ), slim_f( 'intro', 'html', 'Line under the heading' ),
					slim_f( 'map', 'image', 'Body map', [ 'h' => 'The CoolSculpting body map gets its labels drawn on top.' ] ),
					slim_f( 'items', 'repeater', 'Areas', [ 'f' => [ slim_f( 'name', 'text', 'Area' ), slim_f( 'cycles', 'text', 'Cycles', [ 'h' => 'Like "2 to 4".' ] ), slim_f( 'imgs', 'scalars', 'Pictures', [ 'item' => 'image' ] ), slim_f( 'note', 'text', 'Note' ) ] ] ),
				] ] ),
				slim_f( 'plan', 'group', 'Treatment plan pictures', [ 'f' => [
					slim_f( 'title', 'text', 'Section heading' ), slim_f( 'intro', 'html', 'Line under the heading' ),
					slim_f( 'groups', 'repeater', 'Groups', [ 'f' => [ slim_f( 'h', 'text', 'Heading' ), slim_f( 'text', 'html', 'Text' ), $cells ] ] ),
					slim_f( 'credit', 'html', 'Credit line' ),
				] ] ),
				slim_f( 'people', 'group', 'Clients', [ 'f' => [
					slim_f( 'title', 'text', 'Section heading' ), slim_f( 'note', 'html', 'Line under the heading' ),
					slim_f( 'items', 'repeater', 'People', [ 'f' => [ slim_f( 'src', 'image', 'Photo' ), slim_f( 'en', 'text', 'Name in English' ), slim_f( 'th', 'text', 'Name in Thai' ) ] ] ),
				] ] ),
				slim_f( 'reviews', 'group', 'Reviews', [ 'f' => [
					slim_f( 'title', 'text', 'Section heading' ), slim_f( 'note', 'html', 'Line under the heading' ),
					slim_f( 'items', 'repeater', 'Reviews', [ 'f' => [
						slim_f( 'en', 'text', 'Name in English' ), slim_f( 'th', 'text', 'Name in Thai' ), slim_f( 'role', 'text', 'Who they are', [ 'h' => 'Like "Actor". Leave empty if none.' ] ),
						slim_f( 'q', 'textarea', 'Review in English' ), slim_f( 'qth', 'textarea', 'Review in Thai' ),
						slim_f( 'face', 'image', 'Photo of the person' ), slim_f( 'tx', 'image', 'Photo during the treatment' ),
					] ] ),
				] ] ),
				slim_f( 'leaflets', 'repeater', 'Brochures', [ 'f' => [ slim_f( 'full', 'image', 'Full size' ), slim_f( 'thumb', 'image', 'Small copy', [ 'h' => 'Leave empty to use the full size.' ] ), slim_f( 'alt', 'text', 'What it shows' ) ] ] ),
			];
		case 'slim_case':
			return [
				slim_f( 'title', 'text', 'Case', [ 'src' => 'title' ] ),
				slim_f( 'key', 'text', 'Key', [ 'src' => 'slug' ] ),
				slim_f( 'order', 'number', 'Order', [ 'src' => 'order' ] ),
				slim_f( 'tx', 'txpick', 'Treatments', [ 'h' => 'The first one ticked labels the case on the picker.' ] ),
				slim_f( 'raw', 'group', 'Photos', [ 'h' => 'The before and after photos as they are. The pod pictures are cut from them when you save.', 'f' => [ slim_f( 'before', 'image', 'Before' ), slim_f( 'after', 'image', 'After' ) ] ] ),
				slim_f( 'wide', 'bool', 'Wide photos (stack them in the terminal)' ),
				slim_f( 'bdate', 'text', 'Under the before photo', [ 'h' => 'A date or a measurement, like "31 inches".' ] ),
				slim_f( 'adate', 'text', 'Under the after photo' ),
				slim_f( 'facts', 'repeater', 'Facts', [ 'f' => [ slim_f( 'k', 'text', 'Label' ), slim_f( 'v', 'text', 'Value' ) ] ] ),
				slim_f( 'video', 'url', 'Patient video', [ 'h' => 'An MP4 or WebM address. Leave empty to show the picture below.' ] ),
				slim_f( 'poster', 'image', 'Video cover picture' ),
				slim_f( 'img', 'image', 'Picture when there is no video', [ 'h' => 'Usually the machine.' ] ),
				slim_f( 'imgCap', 'text', 'Caption for that picture' ),
				slim_f( 'pod', 'lines', 'Pod pictures', [ 'hidden' => true ] ),
			];
		case 'page:home':
			return [
				slim_f( 'seoTitle', 'text', 'Title in search results' ), slim_f( 'seoDesc', 'textarea', 'Search description' ),
				slim_f( 'h1', 'text', 'Heading' ), slim_f( 'lede', 'textarea', 'Line under the heading' ),
				slim_f( 'shelf', 'text', 'Line above the bottles' ),
				slim_f( 'rxIntro', 'textarea', 'Line above the treatments the formula suggests' ),
				slim_f( 'txH', 'text', 'Treatments heading' ), slim_f( 'txP', 'textarea', 'Treatments line' ),
				slim_f( 'ask', 'group', 'Last tile', [ 'f' => [ slim_f( 'nm', 'text', 'Name' ), slim_f( 'ft', 'text', 'Line under it' ) ] ] ),
				slim_f( 'visit', 'group', 'Your first visit', [ 'f' => [
					slim_f( 'h', 'text', 'Heading' ), slim_f( 'p', 'textarea', 'Text' ), slim_f( 'slipH', 'text', 'Slip heading' ), slim_f( 'slipTag', 'text', 'Slip tag' ),
					slim_f( 'steps', 'repeater', 'Steps', [ 'f' => [ slim_f( 'b', 'text', 'Step' ), slim_f( 's', 'text', 'Line under it' ) ] ] ),
				] ] ),
				slim_f( 'docsH', 'text', 'Doctors heading' ), slim_f( 'docsP', 'textarea', 'Doctors line' ),
				slim_f( 'docsPhoto', 'image', 'Doctors photo', [ 'h' => 'The doctors in a row, left to right in the order of the list below.' ] ),
				slim_f( 'docsAlt', 'text', 'Doctors photo description', [ 'h' => 'For screen readers, like "The five Apex Slim doctors, from left: Dr. Eung, Dr. Annie".' ] ),
				slim_f( 'docs', 'repeater', 'Doctors', [ 'h' => 'Leave empty to hide the section.', 'f' => [ slim_f( 'en', 'text', 'Name in English', [ 'h' => 'Like "Dr. Eung".' ] ), slim_f( 'th', 'text', 'Name in Thai', [ 'h' => 'With the title, like "พญ.ปรณีย์ ฉัตรธานี".' ] ), slim_f( 'lic', 'text', 'Licence number', [ 'h' => 'The number after ว., like "57758".' ] ) ] ] ),
				slim_f( 'longH', 'text', 'Longevity heading' ), slim_f( 'longP', 'textarea', 'Longevity line' ),
				slim_f( 'resultsH', 'text', 'Results heading' ), slim_f( 'resultsP', 'textarea', 'Results line', [ 'h' => 'The cases themselves are under Apex Slim › Results cases.' ] ),
				slim_f( 'notesH', 'text', 'Lab Notes heading' ), slim_f( 'notesP', 'textarea', 'Lab Notes line', [ 'h' => 'Each treatment\'s card is on the treatment.' ] ),
				slim_f( 'labNote', 'group', 'Last Lab Notes card (the lab)', [ 'f' => [ slim_f( 'h', 'text', 'Heading' ), slim_f( 'p', 'textarea', 'Line under it' ) ] ] ),
				slim_f( 'playH', 'text', 'Lab heading' ), slim_f( 'playP', 'textarea', 'Lab text' ), slim_f( 'playBtn', 'text', 'Lab button' ),
			];
		case 'page:lab':
			return [
				slim_f( 'seoTitle', 'text', 'Title in search results' ), slim_f( 'seoDesc', 'textarea', 'Search description' ),
				slim_f( 'h1', 'text', 'Heading' ), slim_f( 'lede', 'textarea', 'Line under the heading' ),
				slim_f( 'bcP', 'textarea', 'Body check: text' ), slim_f( 'bcHint', 'text', 'Body check: how to measure the waist' ), slim_f( 'bcSmall', 'textarea', 'Body check: small print' ),
				slim_f( 'gpP', 'textarea', 'Goal photo: text' ), slim_f( 'gpDisc', 'textarea', 'Goal photo: small print' ),
				slim_f( 'mlP', 'textarea', 'Today\'s meals: text' ), slim_f( 'plate', 'textarea', 'Today\'s meals: the 2:1:1 plate' ), slim_f( 'mlSmall', 'textarea', 'Today\'s meals: small print' ),
				slim_f( 'meals', 'repeater', 'Meals', [ 'h' => 'Each day shows one dish from each meal, picked by the date.', 'f' => [
					slim_f( 'meal', 'text', 'Meal', [ 'h' => 'Like "Breakfast".' ] ),
					slim_f( 'dishes', 'repeater', 'Dishes', [ 'f' => [ slim_f( 'en', 'text', 'Dish in English' ), slim_f( 'th', 'text', 'Dish in Thai' ), slim_f( 'tip', 'textarea', 'Tip' ) ] ] ),
				] ] ),
			];
		case 'page:privacy':
			return [ slim_f( 'body', 'content', 'Policy', [ 'h' => 'Written in the editor above.' ] ) ];
		case 'settings':
			return [
				slim_f( 'siteName', 'text', 'Site name', [ 'h' => 'In page titles, the footer and the forms.' ] ),
				slim_f( 'brand', 'text', 'Logo text' ), slim_f( 'brandSmall', 'text', 'Logo second line' ),
				slim_f( 'groupLine', 'text', 'Footer line', [ 'h' => 'Like "Part of the Apex Medical Center group."' ] ),
				slim_f( 'vary', 'text', 'Results line', [ 'h' => 'Shown in the footer and on the first visit slip.' ] ),
				slim_f( 'company', 'text', 'Registered company name', [ 'h' => 'Shown in the footer and the privacy policy.' ] ),
				slim_f( 'permit', 'text', 'Advertising permit number', [ 'h' => 'The สบส. approval number for the site, shown in the footer once Apex has it.' ] ),
				slim_f( 'line', 'group', 'LINE', [ 'f' => [ slim_f( 'id', 'text', 'LINE ID', [ 'h' => 'Like @apexslim.' ] ), slim_f( 'url', 'url', 'LINE link' ) ] ] ),
				slim_f( 'socials', 'repeater', 'Footer links', [ 'f' => [ slim_f( 'x', 'text', 'Name' ), slim_f( 'h', 'url', 'Address' ) ] ] ),
				slim_f( 'consult', 'group', 'Consult form', [ 'f' => [
					slim_f( 'h', 'text', 'Heading' ), slim_f( 'p', 'textarea', 'Text' ), slim_f( 'formHead', 'text', 'Form heading' ),
					slim_f( 'consent', 'textarea', 'Consent line', [ 'h' => 'The box starts unticked. Each request stores this line and the privacy policy version the visitor agreed to.' ] ),
					slim_f( 'times', 'lines', 'Best time to call', [ 'h' => 'One choice per line.' ] ),
					slim_f( 'sent', 'text', 'Message after sending' ),
				] ] ),
				slim_f( 'notify', 'text', 'Send new requests to', [ 'h' => 'Email addresses, separated by commas. Empty sends them to the site\'s admin email.' ] ),
				slim_f( 'keepDays', 'number', 'Keep requests for (days)', [ 'h' => 'Requests older than this are deleted every night. The privacy policy states the same number.' ] ),
				slim_f( 'ogImage', 'image', 'Picture for shared links', [ 'h' => '1200 x 630. Shown when a page is shared on LINE or Facebook and has no picture of its own.' ] ),
			];
	}
	return [];
}

/** The fixed pages: key => [ admin label, default address ]. */
function slim_page_types(): array {
	return [ 'home' => [ 'Home', 'home' ], 'lab' => [ 'Slim Wellness Lab', 'lab' ], 'privacy' => [ 'Privacy policy', 'privacy-policy' ] ];
}

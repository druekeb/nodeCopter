<? 
	$text = '';
	if (isset($_GET['t'])) {
		$text =base64_encode($_GET['t']);
	}
	echo '<a href="imageDecoder.php?t='. $text .'">'.$text.'</a>'
?>
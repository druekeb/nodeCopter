<? 
	$text = '';
	if (isset($_GET['t'])) {
		$text =base64_encode($_GET['t']);
	}
	echo '<a href="imageDecoder2.php?t='. $text .'">'.$text.'</a>'
?>
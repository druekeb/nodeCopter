<? 
	$image_height = 0;
	$image_width = 0;
	$text = '';
	$font_size=5;
	$center=1;
	$color='black';
	
	if (isset($_GET['t'])) {
		$t =base64_decode($_GET['t']);
		$count = substr_count($t, '_');
		if($count==4){
			list ($image_width, $image_height, $font_size, $center, $text) = split('[_]', $t);
		}else if($count==5){
			list ($image_width, $image_height, $font_size, $center, $color, $text) = split('[_]', $t);
		}
	}

	$im = ImageCreateTrueColor($image_width, $image_height);
	$white = ImageColorAllocate ($im, 255, 255, 255);
	ImageFill($im, 0, 0, $white);
	
	$x=0;
	if($center == 1){
		$text_width = imagefontwidth($font_size)*strlen($text);
 		$center_x = ceil($image_width / 2);
 		$x = $center_x - (ceil($text_width/2)); 
 	}
 	
 	$text_height = imagefontheight($font_size);
 	$center_y = ceil($image_height / 2);
	$y = $center_y - (ceil($text_height/2)); 
	
	if($color=='red'){
		$red = ImageColorAllocate ($im, 255, 0, 0);
		ImageString($im, $font_size, $x, $y, $text, $red);
	}else{
		$black = ImageColorAllocate ($im, 0, 0, 0);
		ImageString($im, $font_size, $x, $y, $text, $black);
	}
	Header ('Content-type: image/png');
	ImagePng($im);
	ImageDestroy($im);
?>
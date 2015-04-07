/**
 *
 * A camera demo using render-to-texture for the new Phaser 3 renderer.
 *
 *
 */

// created while the data is loading (preloader)
function pbCameraRTTDemo( docId )
{
	console.log( "pbCameraRTTDemo c'tor entry" );

	var _this = this;

	this.docId = docId;

	this.camera = null;
	this.game = null;
	this.firstTime = true;
	this.rttTexture = null;
	this.rttFramebuffer = null;
	this.rttRenderbuffer = null;

	// create loader with callback when all items have finished loading
	this.loader = new pbLoader( this.allLoaded, this );

	this.playerImg = this.loader.loadImage( "../img/invader/player.png" );
	this.invaderImg = this.loader.loadImage( "../img/invader/invader32x32x4.png" );
	this.saucerImg = this.loader.loadImage( "../img/invader/invader.png" );
	this.starsImg = this.loader.loadImage( "../img/invader/starfield.png" );
	this.bulletImg = this.loader.loadImage( "../img/invader/bullet.png" );
	this.bombImg = this.loader.loadImage( "../img/invader/enemy-bullet.png" );
	this.rocketImg = this.loader.loadImage( "../img/invader/rockets32x32x8.png" );
	this.smokeImg = this.loader.loadImage( "../img/invader/smoke64x64x8.png" );
	this.explosionImg = this.loader.loadImage( "../img/invader/explode.png" );
	this.fontImg = this.loader.loadImage( "../img/fonts/arcadeFonts/16x16/Bubble Memories (Taito).png" );

	console.log( "pbCameraRTTDemo c'tor exit" );
}


pbCameraRTTDemo.prototype.allLoaded = function()
{
	console.log( "pbCameraRTTDemo.allLoaded" );

	// callback to this.create when ready, callback to this.update once every frame
	this.renderer = new pbRenderer( 'webgl', this.docId, this.create, this.update, this );
};


pbCameraRTTDemo.prototype.create = function()
{
	console.log("pbCameraRTTDemo.create");

	this.camera = new layerClass();
	// _parent, _renderer, _x, _y, _z, _angleInRadians, _scaleX, _scaleY
	this.camera.create(rootLayer, this.renderer, 0, 0, 1.0, 0, 1, 1);
	rootLayer.addChild(this.camera);
	this.game = new pbInvaderDemoCore();
	this.game.create(this, this.camera);
};


pbCameraRTTDemo.prototype.destroy = function()
{
	console.log("pbCameraRTTDemo.destroy");

	this.camera.destroy();
	this.camera = null;

	this.renderer.destroy();
	this.renderer = null;

	this.game.destroy();
	this.game = null;

	this.rttTexture = null;
	this.rttRenderbuffer = null;
	this.rttFramebuffer = null;
};


pbCameraRTTDemo.prototype.update = function()
{
	if (this.firstTime)
	{
		// create the render-to-texture, depth buffer, and a frame buffer to hold them
		this.rttTexture = pbWebGlTextures.initTexture(gl.TEXTURE0, pbRenderer.width, pbRenderer.height);	//512, 512);
		this.rttRenderbuffer = pbWebGlTextures.initDepth(this.rttTexture);
		this.rttFramebuffer = pbWebGlTextures.initFramebuffer(this.rttTexture, this.rttRenderbuffer);

		// create a RAM surface to download the texture to
		this.textureSurface = new pbSurface();
		// _wide, _high, _numWide, _numHigh, _image
		this.textureSurface.create(this.rttTexture.width, this.rttTexture.height, 1, 1, null);
		this.textureSurface.isNPOT = true;
		// create an image to hold the surface
		this.textureImage = new imageClass();
		// _surface, _cellFrame, _anchorX, _anchorY, _tiling, _fullScreen
		this.textureImage.create(this.textureSurface, 0, 0.5, 0.5, false, false);
		// create a sprite to hold the image
		this.textureSprite = new pbSprite();
		// _image, _x, _y, _z, _angleInRadians, _scaleX, _scaleY
		this.textureSprite.create(this.textureImage, 0, 0, 1.0, 0, 1.0, 1.0);
		// bouncing, scaling, spinning variables
		this.tx = 0;
		this.tdx = 3;
		this.ty = 300;
		this.tdy = 2;
		this.tr = 0;
		this.tdr = 0.01;
		this.ts = 0.7;
		this.tds = 0.001;
		// create a transform matrix to draw this image with
		this.transform = pbMatrix3.makeTransform(this.tx, this.ty, this.tr, this.ts, -this.ts);

	    // clear the gl bindings
	    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
	    gl.bindTexture(gl.TEXTURE_2D, null);
	    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    	// set up the renderer postUpdate callback to draw the rendered scene from the RAM surface to the display
	    this.renderer.postUpdate = this.postUpdate;

		// set the frame buffer to be used as the destination during the draw phase of renderer.update
	   	this.renderer.useFramebuffer = this.rttFramebuffer;
	   	this.renderer.useRenderbuffer = this.rttRenderbuffer;

		// don't do this again...
		this.firstTime = false;
	}

	// update the invaders demo core
	this.game.update();
};


pbCameraRTTDemo.prototype.postUpdate = function()
{
	// TODO: why isn't the background dark green from the pbWebGl.prerender clear?  Something is filling it with black and that probably means some wasted cycles.
	// TODO: remove this download then upload.  Add code to register a render-to-texture target as onGPU for the purposes of drawing a camera/layer
	// TODO: then look into multiple bouncing, spinning, scaling cameras for a new demo

	// get the scene we just drew to the rttTexture into the prepared RAM surface
	this.renderer.graphics.textures.prepareTextureForAccess(this.rttTexture);
	this.renderer.graphics.textures.getTextureToSurface(this.textureSurface);
	// make sure the new surface contents are uploaded to the GPU when it's time to draw
	this.textureSurface.image.isDirty = true;

	// move the draw image around
	this.tx += this.tdx;
	if (this.tx <= 0 || this.tx >= pbRenderer.width) this.tdx = -this.tdx;
	this.ty += this.tdy;
	if (this.ty <= 0 || this.ty >= pbRenderer.height) this.tdy = -this.tdy;
	this.tr += this.tdr;
	if (this.tr >= Math.PI * 2.0) this.tr -= Math.PI * 2.0;
	this.ts += this.tds;
	if (this.ts <= 0.4 || this.ts >= 0.8) this.tds = -this.tds;
	this.transform = pbMatrix3.makeTransform(this.tx, this.ty, this.tr, this.ts, -this.ts);

	// draw the sprite holding the RAM surface to the visible display
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);
	// _image, _transform, _z
	this.renderer.graphics.drawImageWithTransform( this.textureImage, this.transform, 1.0 );
};


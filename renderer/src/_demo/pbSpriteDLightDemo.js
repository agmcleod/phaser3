/**
 *
 * SpriteDLight demo - uses a shader to show lighting with normal maps created by the SpriteDLight tool
 *
 */



// created while the data is loading (preloader)
function pbSpriteDLightDemo( docId )
{
	console.log( "pbSpriteDLightDemo c'tor entry" );

	this.rttTexture = null;
	this.rttFramebuffer = null;
	this.rttRenderbuffer = null;

	this.phaserRender = new pbPhaserRender( docId );
	this.phaserRender.create( 'webgl', this.create, this.update, this );

	pbPhaserRender.loader.loadImage( "ball", "../img/sphere3.png" );
	pbPhaserRender.loader.loadImage( "texture", "../img/spriteDLight/standing1_0001.png" );
	this.normalsImg = pbPhaserRender.loader.loadImage( "normals", "../img/spriteDLight/standing1_0001_NORMALS.png" );
	this.specularImg = pbPhaserRender.loader.loadImage( "specular", "../img/spriteDLight/standing1_0001_SPECULAR.png" );

	this.multiLightShaderJSON = pbPhaserRender.loader.loadFile( "../json/spriteDLightSpecular.json" );

	console.log( "pbSpriteDLightDemo c'tor exit" );
}


pbSpriteDLightDemo.prototype.create = function()
{
	console.log("pbSpriteDLightDemo.create");

	// prepare the light circle and a sprite to show where it is
	this.lightPos = { x:0.0, y:0.0, z:-1.0 };
	this.lightRadius = 0.5;
	this.lightAngle = 90.0;
	this.move = 0;
	// this.lightSprite = new pbSprite();
	// this.lightSprite.createWithKey(0, 0, "ball", rootLayer);

	// create a sprite to display
	this.sprite = new pbSprite();
	this.sprite.createWithKey(0, 0, "texture", rootLayer);

	// add the shader
	var jsonString = pbPhaserRender.loader.getFile( this.multiLightShaderJSON ).responseText;
	this.spriteDLightShaderProgram = pbPhaserRender.renderer.graphics.shaders.addJSON( jsonString );

	// create the render-to-texture, depth buffer, and a frame buffer to hold them
	this.rttTextureNumber = 1;
	this.rttTexture = pbWebGlTextures.initTexture(this.rttTextureNumber, 600, 600);
	this.rttFramebuffer = pbWebGlTextures.useFramebufferRenderbuffer( this.rttTexture );

    // get the ImageData for the normals
    this.normalsTextureNumber = 2;
	var imageData = pbPhaserRender.loader.getFile( this.normalsImg );
	// upload the normals image directly to the GPU
	pbPhaserRender.renderer.graphics.textures.prepare(imageData, false, true, this.normalsTextureNumber, true);

    // get the ImageData for the specular information
    this.specularTextureNumber = 3;
	imageData = pbPhaserRender.loader.getFile( this.specularImg );
	// upload the normals image directly to the GPU
	pbPhaserRender.renderer.graphics.textures.prepare(imageData, false, true, this.specularTextureNumber, true);

	// create an independent layer that will be processed in postUpdate to draw all the sprites
	this.layer = new layerClass();
	// _parent, _renderer, _x, _y, _z, _angleInRadians, _scaleX, _scaleY
	this.layer.create(rootLayer, this.phaserRender, 0, 0, 0, 0, 1, 1);

	// create the destination texture and framebuffer
	this.destWidth = 256;
	this.destHeight = 256;
	this.destinationTextures = [];
	this.sprites = [];
	for(var i = 0; i < 5; i++)
	{
		// create a texture
		var tn = 4 + i;
		var texture = pbWebGlTextures.initTexture(tn, this.destWidth, this.destHeight);
		this.destinationTextures[i] = {
			textureNumber : tn,
			texture : texture,
			framebuffer : pbWebGlTextures.initFramebuffer(texture, null)
		};

		// create a sprite which uses that texture
		this.sprites[i] = new pbSprite();
		this.sprites[i].createGPU(pbPhaserRender.width / 2 + (i - 2) * 128, 300, texture, this.layer);
		this.sprites[i].anchorX = 0.5;
		this.sprites[i].anchorY = 0.5;
		this.sprites[i].transform.scaleX = this.sprites[i].transform.scaleY = 1.0;
	}

	// set up the renderer postUpdate callback to apply the filter and draw the result on the display
    pbPhaserRender.renderer.postUpdate = this.postUpdate;

    // detect mouse move over canvas and set the light position there
    var _this = this;
	document.body.onmousemove = function(e) {
		_this.lightPos.x = (e.clientX / pbPhaserRender.width);
		_this.lightPos.y = (e.clientY / pbPhaserRender.height);
		_this.move = pbPhaserRender.frameCount;
		//console.log(_this.lightPos.x, _this.lightPos.y);
	};
};


pbSpriteDLightDemo.prototype.destroy = function()
{
	console.log("pbSpriteDLightDemo.destroy");

	this.phaserRender.destroy();
	this.phaserRender = null;

	this.rttTexture = null;
	this.rttRenderbuffer = null;
	this.rttFramebuffer = null;

	this.destinationTextures = null;
	this.sprites = null;
};


pbSpriteDLightDemo.prototype.update = function()
{
	// pbPhaserRender automatically draws the sprite to the render-to-texture

	// only rotate the light if it's been a while since the last mouse move
	if (pbPhaserRender.frameCount - this.move > 90)
	{
		// move the light source in a circle around the middle of the output texture
		this.lightPos.x = 0.5 + this.lightRadius * Math.cos(this.lightAngle * Math.PI / 180.0);
		this.lightPos.y = 0.5 + this.lightRadius * Math.sin(this.lightAngle * Math.PI / 180.0);
		this.lightAngle += 0.5;
	}
};


/**
 * postUpdate - apply the shader to the rttTexture, then draw the results on screen
 *
 */
pbSpriteDLightDemo.prototype.postUpdate = function()
{
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);

	for(var i = 0, l = this.destinationTextures.length; i < l; i++)
	{
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.destinationTextures[i].framebuffer);
		// clear the destTexture ready to receive a texture with alpha
		gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
		// copy the rttTexture to the framebuffer attached texture, applying a shader as it draws
		gl.activeTexture(gl.TEXTURE1);
		this.lightRelX = this.lightPos.x - this.sprites[i].x / this.destWidth;
		this.lightRelY = this.sprites[i].y / this.destHeight - this.lightPos.y;
		pbPhaserRender.renderer.graphics.applyShaderToTexture( this.rttTexture, this.setShader, this );
	}

	// update the pbSprite layer to draw them all
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);		// clear previous binding
	this.layer.update();
};


// callback to set the correct shader program and it's associated attributes and/or uniforms
pbSpriteDLightDemo.prototype.setShader = function(_shaders, _textureNumber)
{
   	// set the shader program
	_shaders.setProgram(this.spriteDLightShaderProgram, _textureNumber);

	// set the auxillary sampler textures
	gl.uniform1i( _shaders.getSampler( "uNormalSampler" ), this.normalsTextureNumber );
	gl.uniform1i( _shaders.getSampler( "uSpecularSampler" ), this.specularTextureNumber );

	// set the parameters for the shader program
	gl.uniform1f( _shaders.getUniform( "uSpecularMult" ), 24.0 );					// smaller numbers make the specular "hotspot" wider
	gl.uniform3f( _shaders.getUniform( "uSpecularCol" ), 5.0, 5.0, 5.0 );		// larger numbers make the specular effect brighter

	gl.uniform3f( _shaders.getUniform( "uAmbientCol" ), 0.20, 0.20, 0.20 );			// ambient percentage for indirect lighting

	gl.uniform3f( _shaders.getUniform( "uLightCol" ), 1.0, 1.0, 1.0 );				// basic point light colour and brightness
	gl.uniform3f( _shaders.getUniform( "uLightPos" ), this.lightRelX, this.lightRelY, 0.1 );		// hardwire light to 0.1 above the scene (z direction)

	gl.uniform2f( _shaders.getUniform( "uSrcSize" ), this.destWidth, this.destHeight );
};


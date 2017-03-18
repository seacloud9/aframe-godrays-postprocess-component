/* global AFRAME */

require('./ShaderGodRays.js')

if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}

/**
 * A-Frame Godrays Postprocess component for A-Frame.
 */
AFRAME.registerComponent('godrays-postprocess', {
  schema: {},

  /**
   * Set if component needs multiple instancing.
   */
  multiple: false,

  /**
   * Called once when component is attached. Generally for initial setup.
   */
  init: function () {
      var el = this.el;
      this.sphereMesh;

      this.sunPosition = new THREE.Vector3( 0, 5, -5 );
      this.screenSpacePosition = new THREE.Vector3();

      this.mouseX = 0, this.mouseY = 0;

      this.windowHalfX = window.innerWidth / 2;
      this.windowHalfY = window.innerHeight / 2;
      this.camera = this.el.sceneEl.camera;
      this.renderer = this.el.sceneEl.renderer;

      this.orbitRadius = 200;

      this.bgColor = 0x000511;
      this.sunColor = 0xffee00;

      //this.scene  = this.el.sceneEl.object3D;
      //this.renderer.autoClear = false;
      //this.renderer.sortObjects = false;


      this.postprocessing = { enabled : true };
      /*
      this.el.sceneEl.addEventListener('camera-set-active', function (evt) {
          console.log(evt.detail.cameraEl);
          this.camera = evt.detail.cameraEl;
      }.bind(this));
      */

      this.postprocessing.scene = new THREE.Scene();

      this.postprocessing.camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2,  window.innerHeight / 2, window.innerHeight / - 2, -10000, 10000 );
      this.postprocessing.camera.position.z = 100;

      this.postprocessing.scene.add( this.postprocessing.camera );

      var pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat };
      this.postprocessing.rtTextureColors = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, pars );

      // Switching the depth formats to luminance from rgb doesn't seem to work. I didn't
      // investigate further for now.
      // pars.format = THREE.LuminanceFormat;

      // I would have this quarter size and use it as one of the ping-pong render
      // targets but the aliasing causes some temporal flickering

      this.postprocessing.rtTextureDepth = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, pars );

      // Aggressive downsize god-ray ping-pong render targets to minimize cost

      var w = window.innerWidth / 4.0;
      var h = window.innerHeight / 4.0;
      this.postprocessing.rtTextureGodRays1 = new THREE.WebGLRenderTarget( w, h, pars );
      this.postprocessing.rtTextureGodRays2 = new THREE.WebGLRenderTarget( w, h, pars );

      // god-ray shaders

      var godraysGenShader = THREE.ShaderGodRays[ "godrays_generate" ];
      this.postprocessing.godrayGenUniforms = THREE.UniformsUtils.clone( godraysGenShader.uniforms );
      this.postprocessing.materialGodraysGenerate = new THREE.ShaderMaterial( {

          uniforms: this.postprocessing.godrayGenUniforms,
          vertexShader: godraysGenShader.vertexShader,
          fragmentShader: godraysGenShader.fragmentShader

      } );

      var godraysCombineShader = THREE.ShaderGodRays[ "godrays_combine" ];
      this.postprocessing.godrayCombineUniforms = THREE.UniformsUtils.clone( godraysCombineShader.uniforms );
      this.postprocessing.materialGodraysCombine = new THREE.ShaderMaterial( {

          uniforms: this.postprocessing.godrayCombineUniforms,
          vertexShader: godraysCombineShader.vertexShader,
          fragmentShader: godraysCombineShader.fragmentShader

      } );

      var godraysFakeSunShader = THREE.ShaderGodRays[ "godrays_fake_sun" ];
      this.postprocessing.godraysFakeSunUniforms = THREE.UniformsUtils.clone( godraysFakeSunShader.uniforms );
      this.postprocessing.materialGodraysFakeSun = new THREE.ShaderMaterial( {

          uniforms: this.postprocessing.godraysFakeSunUniforms,
          vertexShader: godraysFakeSunShader.vertexShader,
          fragmentShader: godraysFakeSunShader.fragmentShader

      } );

      this.postprocessing.godraysFakeSunUniforms.bgColor.value.setHex( this.bgColor );
      this.postprocessing.godraysFakeSunUniforms.sunColor.value.setHex( this.sunColor );

      this.postprocessing.godrayCombineUniforms.fGodRayIntensity.value = 0.75;

      this.postprocessing.quad = new THREE.Mesh(
          new THREE.PlaneBufferGeometry( window.innerWidth, window.innerHeight ),
          this.postprocessing.materialGodraysGenerate
      );
      this.postprocessing.quad.position.z = -9900;
      this.postprocessing.scene.add( this.postprocessing.quad );
      console.log(this);

  },

  /**
   * Called when component is attached and when component data changes.
   * Generally modifies the entity based on the data.
   */
  update: function (oldData) { },

  /**
   * Called when a component is removed (e.g., via removeAttribute).
   * Generally undoes all modifications to the entity.
   */
  remove: function () { },

  /**
   * Called on each scene tick.
   */
  tick: function (t) {
      this.scene  = this.el.sceneEl.object3D;
      /*
      this.sky = document.querySelector('a-sky').object3D;
      this.sky.children[0].scale = new THREE.Vector3( 6, 6, 6 );
      */


      this.renderer =  this.el.sceneEl.renderer;
      this.renderer.autoClear = false;
      this.renderer.sortObjects = false;
      this.renderer.setClearColor( this.bgColor );
      //console.log(t);
      var time = Date.now() / 4000;

      //this.sphereMesh.position.x = orbitRadius * Math.cos( time );
      //this.sphereMesh.position.z = orbitRadius * Math.sin( time ) - 100;


      this.camera.position.x += ( this.mouseX - this.camera.position.x ) * 0.036;
      this.camera.position.y += ( - ( this.mouseY ) - this.camera.position.y ) * 0.036;

      //this.camera.lookAt( this.scene.position );

      if ( this.postprocessing.enabled ) {
          this.scene.children[2].scale.set(0.001,0.001,0.001);

          // Find the screenspace position of the sun

          this.screenSpacePosition.copy( this.sunPosition ).project( this.camera );

          this.screenSpacePosition.x = ( this.screenSpacePosition.x + 1 ) / 2;
          this.screenSpacePosition.y = ( this.screenSpacePosition.y + 1 ) / 2;

          // Give it to the god-ray and sun shaders

          this.postprocessing.godrayGenUniforms[ "vSunPositionScreenSpace" ].value.x = this.screenSpacePosition.x;
          this.postprocessing.godrayGenUniforms[ "vSunPositionScreenSpace" ].value.y = this.screenSpacePosition.y;

          this.postprocessing.godraysFakeSunUniforms[ "vSunPositionScreenSpace" ].value.x = this.screenSpacePosition.x;
          this.postprocessing.godraysFakeSunUniforms[ "vSunPositionScreenSpace" ].value.y = this.screenSpacePosition.y;

          // -- Draw sky and sun --

          // Clear colors and depths, will clear to sky color

          this.renderer.clearTarget( this.postprocessing.rtTextureColors, true, true, false );

          // Sun render. Runs a shader that gives a brightness based on the screen
          // space distance to the sun. Not very efficient, so i make a scissor
          // rectangle around the suns position to avoid rendering surrounding pixels.

          var sunsqH = 0.74 * window.innerHeight; // 0.74 depends on extent of sun from shader
          var sunsqW = 0.74 * window.innerHeight; // both depend on height because sun is aspect-corrected

          this.screenSpacePosition.x *= window.innerWidth;
          this.screenSpacePosition.y *= window.innerHeight;

          this.renderer.setScissor( this.screenSpacePosition.x - sunsqW / 2, this.screenSpacePosition.y - sunsqH / 2, sunsqW, sunsqH );
          this.renderer.setScissorTest( true );

          this.postprocessing.godraysFakeSunUniforms[ "fAspect" ].value = window.innerWidth / window.innerHeight;

          this.postprocessing.scene.overrideMaterial = this.postprocessing.materialGodraysFakeSun;
          this.renderer.render( this.postprocessing.scene, this.postprocessing.camera, this.postprocessing.rtTextureColors );

          this.renderer.setScissorTest( false );

          // -- Draw scene objects --

          // Colors

          this.scene.overrideMaterial = null;
          this.renderer.render( this.scene, this.camera, this.postprocessing.rtTextureColors );

          // Depth

          this.scene.overrideMaterial = this.materialDepth;
          this.renderer.render( this.scene , this.camera, this.postprocessing.rtTextureDepth, true );

          // -- Render god-rays --

          // Maximum length of god-rays (in texture space [0,1]X[0,1])

          var filterLen = 1.0;

          // Samples taken by filter

          var TAPS_PER_PASS = 6.0;

          // Pass order could equivalently be 3,2,1 (instead of 1,2,3), which
          // would start with a small filter support and grow to large. however
          // the large-to-small order produces less objectionable aliasing artifacts that
          // appear as a glimmer along the length of the beams

          // pass 1 - render into first ping-pong target

          var pass = 1.0;
          var stepLen = filterLen * Math.pow( TAPS_PER_PASS, -pass );

          this.postprocessing.godrayGenUniforms[ "fStepSize" ].value = stepLen;
          this.postprocessing.godrayGenUniforms[ "tInput" ].value = this.postprocessing.rtTextureDepth.texture;

          this.postprocessing.scene.overrideMaterial = this.postprocessing.materialGodraysGenerate;

          this.renderer.render( this.postprocessing.scene, this.postprocessing.camera, this.postprocessing.rtTextureGodRays2 );

          // pass 2 - render into second ping-pong target

          pass = 2.0;
          stepLen = filterLen * Math.pow( TAPS_PER_PASS, -pass );

          this.postprocessing.godrayGenUniforms[ "fStepSize" ].value = stepLen;
          this.postprocessing.godrayGenUniforms[ "tInput" ].value = this.postprocessing.rtTextureGodRays2.texture;

          this.renderer.render( this.postprocessing.scene, this.postprocessing.camera, this.postprocessing.rtTextureGodRays1  );

          // pass 3 - 1st RT

          pass = 3.0;
          stepLen = filterLen * Math.pow( TAPS_PER_PASS, -pass );

          this.postprocessing.godrayGenUniforms[ "fStepSize" ].value = stepLen;
          this.postprocessing.godrayGenUniforms[ "tInput" ].value = this.postprocessing.rtTextureGodRays1.texture;

          this.renderer.render( this.postprocessing.scene, this.postprocessing.camera , this.postprocessing.rtTextureGodRays2  );

          // final pass - composite god-rays onto colors

          this.postprocessing.godrayCombineUniforms["tColors"].value = this.postprocessing.rtTextureColors.texture;
          this.postprocessing.godrayCombineUniforms["tGodRays"].value = this.postprocessing.rtTextureGodRays2.texture;

          this.postprocessing.scene.overrideMaterial = this.postprocessing.materialGodraysCombine;

          this.renderer.render( this.postprocessing.scene, this.postprocessing.camera );
          this.postprocessing.scene.overrideMaterial = null;

      } else {

          this.renderer.clear();
          this.renderer.render( this.scene , this.camera );

      }
  },

  /**
   * Called when entity pauses.
   * Use to stop or remove any dynamic or background behavior such as events.
   */
  pause: function () { },

  /**
   * Called when entity resumes.
   * Use to continue or add any dynamic or background behavior such as events.
   */
  play: function () {
      var el = this.el,
          renderer = el.sceneEl.renderer;


  }
});

import {
    ShaderMaterial,
    UniformsUtils, SrcAlphaFactor, AddEquation, OneMinusSrcAlphaFactor, CustomBlending
} from 'three';
import { Pass, FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';

const shader = {

    name: 'CopyShader',

    uniforms: {

        'tDiffuse': { value: null },
        'opacity': { value: 1.0 }

    },

    vertexShader: /* glsl */`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,

    fragmentShader: /* glsl */`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = 1.0 - texture2D( tDiffuse, vUv );
			gl_FragColor = vec4(texel.rgb, opacity);


		}`

};


export class VideoEffectPass extends Pass {

    constructor( map, opacity ) {

        super();

        this.map = map;
        this.opacity = ( opacity !== undefined ) ? opacity : 1.0;

        this.uniforms = UniformsUtils.clone( shader.uniforms );

        this.material = new ShaderMaterial( {

            uniforms: this.uniforms,
            vertexShader: shader.vertexShader,
            fragmentShader: shader.fragmentShader,
            blending: CustomBlending,
            blendEquation: AddEquation,
            blendSrc: SrcAlphaFactor,
            blendDst: OneMinusSrcAlphaFactor,
            depthTest: false,
            depthWrite: false,
            premultipliedAlpha: true

        } );

        this.needsSwap = false;

        this.fsQuad = new FullScreenQuad( null );

    }

    render( renderer, writeBuffer, readBuffer /*, deltaTime, maskActive */ ) {

        const oldAutoClear = renderer.autoClear;
        renderer.autoClear = false;

        this.fsQuad.material = this.material;

        this.uniforms[ 'opacity' ].value = this.opacity;
        this.uniforms[ 'tDiffuse' ].value = this.map;
        this.material.transparent = true;

        renderer.setRenderTarget( this.renderToScreen ? null : readBuffer );
        if ( this.clear ) renderer.clear();
        this.fsQuad.render( renderer );

        renderer.autoClear = oldAutoClear;

    }

    dispose() {

        this.material.dispose();

        this.fsQuad.dispose();

    }

}


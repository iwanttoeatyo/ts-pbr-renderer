import { mat3, mat4 } from "gl-matrix";
import { Uniform } from "../Uniform";

const modelview_matrix: mat4 = mat4.create();
const normalview_matrix: mat3 = mat3.create();
const mvp_matrix: mat4 = mat4.create();

export class Shader {
    public uniforms: Map<string, Uniform>;
    public attributes: Map<string, GLint>;
    public readonly ID: WebGLProgram;
    public readonly gl: WebGL2RenderingContext;

    public constructor(gl: WebGL2RenderingContext, vertexSourceCode: string, fragmentSourceCode: string) {
        this.gl = gl;

        const vertexShader: WebGLShader = Shader.getCompiledShader(gl, vertexSourceCode, gl.VERTEX_SHADER);
        const fragmentShader: WebGLShader = Shader.getCompiledShader(gl, fragmentSourceCode, gl.FRAGMENT_SHADER);

        this.ID = gl.createProgram()!;
        gl.attachShader(this.ID, vertexShader);
        gl.attachShader(this.ID, fragmentShader);
        gl.linkProgram(this.ID);

        if (!gl.getProgramParameter(this.ID, gl.LINK_STATUS)) {
            alert("Could not initialize shaders");
        }

        //TODO: Copy what twgl does and get the uniform names from the shader, before the user does
        this.uniforms = new Map<string, Uniform>();
        this.attributes = new Map<string, GLint>();
        this.initUniforms();
    }

    public initUniforms(): void {
        const gl = this.gl;
        const num_uniforms = gl.getProgramParameter(this.ID, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < num_uniforms; i++) {
            const info: WebGLActiveInfo = gl.getActiveUniform(this.ID, i)!;
            this.uniforms.set(info.name, new Uniform(gl, this.ID, info));
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public setUniform(name: string, value: any | any[]): void {
        const uniform = this.uniforms.get(name);
        if (uniform) uniform.set(value);
    }

    public setModelViewBlock(model_matrix: mat4, view_matrix: mat4, proj_matrix: mat4): void {
        //Model view matrix
        mat4.mul(modelview_matrix, view_matrix, model_matrix);

        //Normal matrix in view space
        // mat3.normalFromMat4(normalview_matrix,model_matrix);
        // this.setMat3ByName("u_normal_matrix", normalview_matrix);
        mat3.normalFromMat4(normalview_matrix, modelview_matrix);

        //MVP Matrix
        mat4.mul(mvp_matrix, proj_matrix, modelview_matrix);

        //   this.setMat4ByName("u_model_matrix", model_matrix);
        this.setUniform("u_view_matrix", view_matrix);
        this.setUniform("u_modelview_matrix", modelview_matrix);
        this.setUniform("u_normalview_matrix", normalview_matrix);
        this.setUniform("u_mvp_matrix", mvp_matrix);
        console.dir(mvp_matrix);
    }

    public setViewProjBlock(view_matrix: mat4, proj_matrix: mat4): void {
        mat4.mul(mvp_matrix, proj_matrix, view_matrix);
        this.setUniform("u_view_matrix", view_matrix);
        this.setUniform("u_proj_matrix", proj_matrix);
        this.setUniform("u_vp_matrix", mvp_matrix);
    }

    public delete(): void {
        this.gl.deleteShader(this.ID);
    }

    public use(): void {
        this.gl.useProgram(this.ID);
    }

    public setAttributes(attr: string[]): void {
        for (let a of attr) {
            this.attributes.set(a, this.gl.getAttribLocation(this.ID, a));
        }
    }

    public setUniforms(uniforms: Map<string, any>): void {
        for (let [name, value] of uniforms) {
            if (value) this.setUniform(name, value);
        }
    }

    private static getCompiledShader(gl: WebGL2RenderingContext, sourceCode: string, type: number): WebGLShader {
        let shader: WebGLShader;
        shader = gl.createShader(type)!;

        gl.shaderSource(shader, sourceCode);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(shader));
        }
        return shader;
    }
}

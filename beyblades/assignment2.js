import {defs, tiny} from './examples/common.js';

const {Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture} = tiny;

class Base_Scene extends Scene {
    /**
     *  **Base_scene** is a Scene that can be added to any display canvas.
     *  Setup the shapes, materials, camera, and lighting here.
     */
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();
        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            'arena': new defs.Rounded_Capped_Cylinder(30, 30),
            'cylinder' : new defs.Capped_Cylinder(1,6),
            'cone': new defs.Closed_Cone(15, 6),
        };

        // *** Materials
        this.materials = {
            plastic: new Material(new defs.Phong_Shader(),{
                ambient: .4,
                diffusivity: .6,
                color: hex_color("#ffffff")
            }),
            star_texture: new Material(new defs.Textured_Phong(), {
                color: color(0,0,0,1),
                ambient: 1, diffusivity: 0.1, specularity: 0.1,
                texture: new Texture("assets/stars.png","NEAREST")
            }),
            rings: new Material(new Ring_Shader(),),
        };

        this.time = 0;
        this.still = false;
        this.b1_jumping = false;
        this.b1_jump_duration = 0;
    }

    display(context, program_state) {
        // display():  Called once per frame of animation. Here, the base class's display only does
        // some initial setup.

        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(Mat4.translation(0, 0, -30).times(Mat4.rotation(Math.PI/4, 1, 0, 0)));
        }
        program_state.projection_transform = Mat4.perspective(Math.PI / 4, context.width / context.height, 1, 100);

        // *** Lights: *** Values of vector or point lights.
        const light_position = vec4(0, 5, 5, 1);
        program_state.lights = [new Light(light_position,color(1, 1, 1, 1),1000)];
    }
}

export class Assignment2 extends Base_Scene {
    /**
     * This Scene object can be added to any display canvas.
     * We isolate that code so it can be experimented with on its own.
     * This gives you a very small code sandbox for editing a simple scene, and for
     * experimenting with matrix transformations.
     */

    make_control_panel() {
        this.key_triggered_button("Sit still", ["m"], ()=>{
            this.still ^= 1;
        }
        );
        this.key_triggered_button("B1 Jump", ["j"], ()=>{
            if(this.b1_jump_duration == 0)
                this.b1_jumping ^= 1;
        }
        );
    }

    draw_beyblade(context,program_state,model_transform,base,top) {
        this.shapes.cone.draw(context,program_state,model_transform.times(Mat4.rotation(Math.PI/2,1,0,0)),base);
        this.shapes.cylinder.draw(context,program_state,model_transform.times(Mat4.translation(0,0.5,0).times(Mat4.scale(1.5,0.4,1.5)).times(Mat4.rotation(Math.PI/2,1,0,0))),top);
    }

    is_colliding(b1_location, b2_location, threshold) {
        //threshold should be 1.5
        let v = b1_location.minus(b2_location);
        if(v.norm() <= threshold)
            return true;
        return false;
    }

    display(context, program_state) {
        const t = this.time, dt = program_state.animation_delta_time / 1000;
        const v1 = 3;
        const v2 = 5;

        const v_y = 9.8;

        let b1_y_trans = 1.5;

        super.display(context, program_state);
        let model_transform = Mat4.identity();
        model_transform = model_transform.times(Mat4.rotation(Math.PI / 2,1,0,0));
        model_transform = model_transform.times(Mat4.scale(10,10,1));
        
        this.shapes.arena.draw(context, program_state, model_transform, this.materials.plastic);

        if(!this.still)
            this.time += dt;

        if (this.b1_jumping)
        {
            this.b1_jump_duration += dt;
            b1_y_trans = 1+ v_y * this.b1_jump_duration - 4.9 * this.b1_jump_duration*this.b1_jump_duration;
        }
        if (Math.abs(this.b1_jump_duration - 2) <= 0.001)
        {
            this.b1_jumping = false;
            this.b1_jump_duration = 0;
        }
        let b1_transform = Mat4.translation(5*Math.cos(v1 * t),b1_y_trans,5*Math.sin(v1 * t))
                                .times(Mat4.rotation(20*t,0,1,0));
        this.draw_beyblade(context, program_state, b1_transform,
            this.materials.plastic.override({color : color (0.69,0.42,0.1,1)}),
            this.materials.rings);


        let b2_location =  Mat4.translation(-2*Math.cos(v2 * -t),1.5,-2*Math.sin(v2 * -t))
                                .times(Mat4.rotation(20*t,0,1,0));
        this.draw_beyblade(context, program_state, b2_location,
            this.materials.plastic.override({color : color (1,0.42,0.1,1)}),
            this.materials.star_texture);
        


    }
}

class Ring_Shader extends Shader {
    update_GPU(context, gpu_addresses, graphics_state, model_transform, material) {
        // update_GPU():  Defining how to synchronize our JavaScript's variables to the GPU's:
        const [P, C, M] = [graphics_state.projection_transform, graphics_state.camera_inverse, model_transform],
            PCM = P.times(C).times(M);
        context.uniformMatrix4fv(gpu_addresses.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
        context.uniformMatrix4fv(gpu_addresses.projection_camera_model_transform, false,
            Matrix.flatten_2D_to_1D(PCM.transposed()));
    }

    shared_glsl_code() {
        // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
        return `
        precision mediump float;
        varying vec4 point_position;
        varying vec4 center;
        `;
    }

    vertex_glsl_code() {
        // ********* VERTEX SHADER *********
        // TODO:  Complete the main function of the vertex shader (Extra Credit Part II).
        return this.shared_glsl_code() + `
        attribute vec3 position;
        uniform mat4 model_transform;
        uniform mat4 projection_camera_model_transform;
        
        void main(){
            gl_Position = projection_camera_model_transform * vec4(position, 1.0);
            center = model_transform * vec4(0.0,0.0,0.0,1.0);
            point_position = model_transform * vec4(position, 1.0);
        }`;
    }

    fragment_glsl_code() {
        // ********* FRAGMENT SHADER *********
        // TODO:  Complete the main function of the fragment shader (Extra Credit Part II).
        return this.shared_glsl_code() + `
        void main(){
            float factor = sin(20.0 * distance(center.xyz, point_position.xyz));
            gl_FragColor = factor * vec4(0.980, 0.788, 0.101, 1.0);
        }`;
    }
}
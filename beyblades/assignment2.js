import {defs, tiny} from './examples/common.js';

const {Vector, Vector3, vec, vec3, vec4, color, hex_color, Matrix, Mat4, Light, Shape, Material, Scene, Texture} = tiny;

class Base_Scene extends Scene {
    /**
     *  **Base_scene** is a Scene that can be added to any display canvas.
     *  Setup the shapes, materials, camera, and lighting here.
     */
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();
        this.still = this.outlined = false;
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
        };
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
        this.key_triggered_button("Outline", ["o"], ()=>{
            this.outlined ^= 1;
        }
        );
        this.key_triggered_button("Sit still", ["m"], ()=>{
            this.still ^= 1;
        }
        );
    }

    draw_beyblade(context,program_state,model_transform,base,top) {
        this.shapes.cone.draw(context,program_state,model_transform.times(Mat4.rotation(Math.PI/2,1,0,0)),base);
        this.shapes.cylinder.draw(context,program_state,model_transform.times(Mat4.translation(0,0.5,0).times(Mat4.scale(1.5,0.4,1.5)).times(Mat4.rotation(Math.PI/2,1,0,0))),top);
    }
    display(context, program_state) {
        const t = program_state.animation_time / 1000;
        const v1 = 3;
        const v2 = 5;

        super.display(context, program_state);
        let model_transform = Mat4.identity();
        model_transform = model_transform.times(Mat4.rotation(Math.PI / 2,1,0,0));
        model_transform = model_transform.times(Mat4.scale(10,10,1));
        
        this.shapes.arena.draw(context, program_state, model_transform, this.materials.plastic);

        let b1_location = Mat4.translation(5*Math.cos(v1 * t),1,5*Math.sin(v1 * t))
                                .times(Mat4.rotation(20*t,0,1,0))
        this.draw_beyblade(context, program_state, b1_location,
            this.materials.plastic.override({color : color (0.69,0.42,0.1,1)}),
            this.materials.plastic.override({color : color (0.42,0.69,0.1,1)}));


        let b2_location =  Mat4.translation(-2*Math.cos(v2 * -t),1,-2*Math.sin(v2 * -t))
                                .times(Mat4.rotation(20*t,0,1,0))
        this.draw_beyblade(context, program_state, b2_location,
            this.materials.plastic.override({color : color (1,0.42,0.1,1)}),
            this.materials.star_texture);

        // orientation cubes
        // this.shapes.cube.draw(context, program_state, Mat4.translation(5, 0, 0), this.materials.plastic.override({color: color(1, 0, 0, 1)}));
        // this.shapes.cube.draw(context, program_state, Mat4.translation(-5, 0, 0), this.materials.plastic);
        // this.shapes.cube.draw(context, program_state, Mat4.translation(0, 5, 0), this.materials.plastic.override({color: color(1, 0, 0, 1)}));
        // this.shapes.cube.draw(context, program_state, Mat4.translation(0, -5, 0), this.materials.plastic);



    }
}

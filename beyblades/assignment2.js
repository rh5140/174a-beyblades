import {defs, tiny} from './examples/common.js';

const {Vector, Vector3, vec, vec3, vec4, color, hex_color, Matrix, Mat4, Light, Shape, Material, Scene, } = tiny;

class Cube extends Shape {
    constructor() {
        super("position", "normal", );
        // Loop 3 times (for each axis), and inside loop twice (for opposing cube sides):
        this.arrays.position = Vector3.cast([-1, -1, -1], [1, -1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, -1], [-1, 1, -1], [1, 1, 1], [-1, 1, 1], [-1, -1, -1], [-1, -1, 1], [-1, 1, -1], [-1, 1, 1], [1, -1, 1], [1, -1, -1], [1, 1, 1], [1, 1, -1], [-1, -1, 1], [1, -1, 1], [-1, 1, 1], [1, 1, 1], [1, -1, -1], [-1, -1, -1], [1, 1, -1], [-1, 1, -1]);
        this.arrays.normal = Vector3.cast([0, -1, 0], [0, -1, 0], [0, -1, 0], [0, -1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, -1], [0, 0, -1], [0, 0, -1], [0, 0, -1]);
        // Arrange the vertices into a square shape in texture space too:
        this.indices.push(0, 1, 2, 1, 3, 2, 4, 5, 6, 5, 7, 6, 8, 9, 10, 9, 11, 10, 12, 13, 14, 13, 15, 14, 16, 17, 18, 17, 19, 18, 20, 21, 22, 21, 23, 22);
    }
}

class Cube_Outline extends Shape {
    constructor() {
        super("position", "color");
        const white = hex_color("#ffffff");
        this.arrays.position = Vector3.cast([-1, -1, -1], [1, -1, -1], 
                                            [1, -1, -1], [1, 1, -1], 
                                            [1, 1, -1], [-1, 1, -1], 
                                            [-1, 1, -1], [-1, -1, -1], 
                                            [-1, 1, 1], [1, 1, 1], 
                                            [1, 1, 1], [1, -1, 1], 
                                            [1, -1, 1], [-1, -1, 1], 
                                            [-1, -1, 1], [-1, 1, 1], 
                                            [-1, -1, -1], [-1, -1, 1], 
                                            [1, -1, 1], [1, -1, -1], 
                                            [1, 1, 1], [1, 1, -1], 
                                            [-1, 1, 1], [-1, 1, -1]);
        this.arrays.color = [white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white];
        this.indices = false;
    }
}

class Cube_Single_Strip extends Shape {
    constructor() {
        super("position", "normal");
        // TODO (Requirement 6)
        this.arrays.position = Vector3.cast([1, 1, -1], [-1, 1, -1], [1, 1, 1], [-1, 1, 1], [1, -1, -1], [-1, -1, -1], [-1, -1, 1], [1, -1, 1]);
        this.arrays.normal = Vector3.cast([1, 1, -1], [-1, 1, -1], [1, 1, 1], [-1, 1, 1], [1, -1, -1], [-1, -1, -1], [-1, -1, 1], [1, -1, 1]);
        this.indices.push(0, 1, 4, 5, 6, 1, 3, 0, 2, 4, 7, 6, 2, 3);
    }
}

class Base_Scene extends Scene {
    /**
     *  **Base_scene** is a Scene that can be added to any display canvas.
     *  Setup the shapes, materials, camera, and lighting here.
     */
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();
        this.still = this.outlined = false;
        this.num_boxes = 8;
        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            'cube': new Cube(),
            'outline': new Cube_Outline(),
            'strip': new Cube_Single_Strip(),
            'arena': new defs.Rounded_Capped_Cylinder(30, 30),
            'beyblade': new defs.Closed_Cone(15, 6),
        };

        // *** Materials
        this.materials = {
            plastic: new Material(new defs.Phong_Shader(),{
                ambient: .4,
                diffusivity: .6,
                color: hex_color("#ffffff")
            }),
        };
        // The white material and basic shader are used for drawing the outline.
        this.white = new Material(new defs.Basic_Shader());

        // *** Colors
        this.colors = [];
        for (let i = 0; i < this.num_boxes; i++) {
            this.colors[i] = color(Math.random(), Math.random(), Math.random(), 1.0);
        }
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
    set_colors() {
        for (let i = 0; i < this.num_boxes; i++) {
            this.colors[i] = color(Math.random(), Math.random(), Math.random(), 1.0);
        }
    }

    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        this.key_triggered_button("Change Colors", ["c"], this.set_colors);
        // Add a button for controlling the scene.
        this.key_triggered_button("Outline", ["o"], ()=>{
            this.outlined ^= 1;
        }
        );
        this.key_triggered_button("Sit still", ["m"], ()=>{
            this.still ^= 1;
        }
        );
    }

    theta(program_state) {
        return .025 * Math.PI + .025 * Math.PI * Math.sin(.002 * Math.PI * program_state.animation_time);
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
                                .times(Mat4.rotation(Math.PI/2,1,0,0));
        this.shapes.beyblade.draw(context, program_state, b1_location, this.materials.plastic.override({color: color(0.69, 0.420, 0.1, 1)}));
        
        let b2_location =  Mat4.translation(-2*Math.cos(v2 * -t),1,-2*Math.sin(v2 * -t))
                                .times(Mat4.rotation(20*t,0,1,0))
                                .times(Mat4.rotation(Math.PI/2,1,0,0))
        this.shapes.beyblade.draw(context, program_state, b2_location,this.materials.plastic.override({color: color(1, 0, 0, 1)}));

        // orientation cubes
        // this.shapes.cube.draw(context, program_state, Mat4.translation(5, 0, 0), this.materials.plastic.override({color: color(1, 0, 0, 1)}));
        // this.shapes.cube.draw(context, program_state, Mat4.translation(-5, 0, 0), this.materials.plastic);
        // this.shapes.cube.draw(context, program_state, Mat4.translation(0, 5, 0), this.materials.plastic.override({color: color(1, 0, 0, 1)}));
        // this.shapes.cube.draw(context, program_state, Mat4.translation(0, -5, 0), this.materials.plastic);



    }
}

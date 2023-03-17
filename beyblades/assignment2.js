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
            'background': new defs.Subdivision_Sphere(4),
        };
        this.shapes.background.arrays.texture_coord.forEach(p => p.scale_by(3));
        this.shapes.arena.arrays.texture_coord.forEach(p=>p.scale_by(0.2));

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
            fire_texture: new Material(new defs.Textured_Phong(), {
                color: hex_color("#000000"),
                ambient: 1, diffusivity: 1, specularity: 1,
                texture: new Texture("assets/fire.jpg", "LINEAR_MIPMAP_LINEAR")
            }),
            rock_texture: new Material(new defs.Textured_Phong(), {
                color: hex_color("#000000"),
                ambient: 1, diffusivity: 1, specularity: 1,
                texture: new Texture("assets/rck_2.png","LINEAR_MIPMAP_LINEAR")
            })
        };

        this.beyblades = [new beyblade(
            this.materials.plastic.override({color: color(0.69,0.42,0.1,1)}), this.materials.star_texture,3,2,5,20,true
        ),
        new beyblade(
             this.materials.plastic.override({color: color(0.42,0.69,1,1)}), this.materials.rings,2,-1,3,-20,false
        )]

        this.beyarena = new arena();

        this.initial_camera = Mat4.translation(0, 0, -30).times(Mat4.rotation(Math.PI/4, 1, 0, 0));

        this.fire_transform = Mat4.scale(50,50,50);

        this.audio = {
            bgm: new Audio(),
            crash: new Audio(),
        }
        this.audio.crash.src = 'assets/crash.mp3';
        this.audio.bgm.src = 'assets/turbo.mp3';

        Object.keys(this.audio).forEach((key) => {
            this.audio[key].volume = 0.5;
        });
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

class arena{
    constructor()
    {
        this.transform = Mat4.translation(0, 0, 0);
        this.time = 0;
        this.still = true;
        this.jumping = false;
        this.jump_duration = 0;
        this.v_y = 10;
        this.g = 30;
    }

    update(dt)
    {
        if(!this.still) {
            let arena_y_trans = 0;
            if (this.jumping) {
                this.jump_duration += dt;
                arena_y_trans += this.v_y * this.jump_duration - this.g / 2 * Math.pow(this.jump_duration, 2);
            }
            if (this.jump_duration > 2 * this.v_y / this.g) {
                this.jumping = false;
                this.jump_duration = 0;
            }

            this.time += dt;

            let arena_trans = Mat4.translation(
                0,
                arena_y_trans,
                0);

            this.y = arena_y_trans;
            this.transform = arena_trans;
        }
    }
}
class beyblade{
    constructor(base_material, top_material, orbitx, orbitz, v_o, rot_speed,player)
    {
        this.transform = Mat4.translation(orbitx,1.5, orbitz);
        this.materials = {base: base_material, top: top_material};
        this.orbit = {x: orbitx, z : orbitz, speed: v_o};
        this.time = 0;
        this.rot_speed = rot_speed;
        this.still = true;
        this.jumping = false;
        this.isplayer = player;
        this.jump_duration = 0;
        this.v_y = 15;
        this.g = 30;
        this.out_of_bounds = false;
        this.collision = {
            on: false,
            direction: vec4(0,0,0,0), //the direction of collision, the center of rotation will be moving along this
            duration: 0, //time since collision
            max_duration: 0.1, //max time for collision
            multiplier: 0.08, //logarithmic multiplier for collision distance
            matrix: Mat4.identity(), //center of rotation (e.g. originally (0,0,0,1) )
        };
    }

    update(collider,dt,arena,crash)
    {
        if(!this.still)
        {
            if(this.out_of_bounds)
            {
                this.transform = this.transform.times(Mat4.translation(0,-1,0));
            }
            else
            {
                let b_y_trans = 1.5;
                
                if (this.jumping)
                {
                    this.jump_duration += dt;
                    b_y_trans += this.v_y * this.jump_duration - this.g/2 * Math.pow(this.jump_duration,2);
                }
                if (b_y_trans <= 1.5)
                {
                    b_y_trans = 1.5;
                    this.jumping = false;
                    this.jump_duration = 0;
                }
                if(b_y_trans <= arena.y + 1.5) {
                    b_y_trans = arena.y + 1.5;
                }

                this.time += dt;
                let t =  this.time;

                let b_trans = Mat4.translation(
                    this.orbit.x*Math.cos(this.orbit.speed * t),
                    b_y_trans,
                    this.orbit.z*Math.sin(this.orbit.speed * t));

                //this.transform = b_trans;
                b_trans = b_trans.times(this.collision.matrix);

                let dv = this.transform.times(vec4(0,0,0,1)).minus(collider);
                let iscolliding = dv.norm() <= 3;
                if(iscolliding){
                    this.collision.on = true;
                    this.collision.direction = dv.normalized();
                    if(this.time > 3)
                        this.collision.multiplier = Math.random()*0.3 + 0.08;

                    crash.play();
                }
                if(this.collision.on && !this.still) {
                    if(this.collision.duration > this.collision.max_duration){
                        this.collision.on = false;
                        this.collision.duration = 0;
                    }
                    else{
                        this.collision.duration += dt;
                        let mult = this.collision.multiplier*Math.log2(this.collision.duration/this.collision.max_duration + 1) + this.collision.multiplier;
                        this.collision.matrix = this.collision.matrix.times(Mat4.translation(
                            mult*this.collision.direction[0],
                            0,
                            mult*this.collision.direction[2]
                        ));
                    }
                }
                else if(!iscolliding) {
                    // gravity towards the center (pushing the beyblades inwards constantly)
                    let ctr = this.collision.matrix.times(vec4(0, 0, 0, 1));
                    let g_factor = 0.99;

                    this.collision.matrix = Mat4.translation(ctr[0] * g_factor, 0, ctr[2] * g_factor);
                }

                this.transform = b_trans.times(Mat4.rotation(this.rot_speed*t,0,1,0));
            }
            if(this.transform.times(vec4(0,0,0,1)).minus(vec4(0,0,0,1)).norm() > 10)
                this.out_of_bounds = true;
        }
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
            for(let i = 0; i < this.beyblades.length; i++){
                this.beyblades[i].still ^= 1;
            }
            this.beyarena.still ^= 1;
            this.audio.bgm.play();
        }
        );
        this.key_triggered_button("B1 Jump", ["j"], ()=> {
                for (let i = 0; i < this.beyblades.length; i++) {
                    if (this.beyblades[i].isplayer && !this.beyblades[i].jumping && !this.beyblades[i].still)
                        this.beyblades[i].jumping ^= 1;
                }
            }
        );
        
        this.key_triggered_button("B2 Jump", ["c"], ()=> {
            for (let i = 0; i < this.beyblades.length; i++) {
                if (!this.beyblades[i].isplayer && !this.beyblades[i].jumping && !this.beyblades[i].still)
                    this.beyblades[i].jumping ^= 1;
                }
            }
        );

        this.key_triggered_button("Arena Jump", ["h"], ()=> {
                if(!this.beyarena.still) {
                    if (!this.beyarena.jumping) {
                        this.beyarena.jumping ^= 1;
                        for (let i = 0; i < this.beyblades.length; i++) {
                            if (!this.beyblades[i].jumping)
                                this.beyblades[i].jumping ^= 1;
                        }
                    }
                }
            }
        );
                    
        this.key_triggered_button("Reset", ["r"], ()=>{
                this.beyblades = [new beyblade(
                    this.materials.plastic.override({color: color(0.69,0.42,0.1,1)}), this.materials.star_texture,3,2,5,20,true
                ),
                    new beyblade(
                        this.materials.plastic.override({color: color(0.42,0.69,1,1)}), this.materials.rings,2,-1,3,-20,false
                    )]
                this.beyarena = new arena();
        }
        );
        this.new_line();
        this.key_triggered_button("R-", ["u"], ()=>{
           let R = this.beyblades[0].materials.base.color;
           if(R[0] > 0)
               R[0] = Math.max(0, R[0] - 0.01);
        });
        const red_controls = this.control_panel.appendChild(document.createElement("span"));
        this.live_string(box => {
            box.textContent = "R: "+ this.beyblades[0].materials.base.color[0].toFixed(2);
        }, red_controls);
        this.key_triggered_button("R+", ["i"], ()=>{
            let R = this.beyblades[0].materials.base.color;
            if(R[0] < 1)
                R[0] = Math.min(1, R[0] + 0.01);
        });

        this.new_line();
        this.key_triggered_button("G-", ["k"], ()=>{
            let R = this.beyblades[0].materials.base.color;
            if(R[1] > 0)
                R[1] = Math.max(0, R[1] - 0.01);
        });
        const green_controls = this.control_panel.appendChild(document.createElement("span"));
        this.live_string(box => {
            box.textContent = "G: "+ this.beyblades[0].materials.base.color[1].toFixed(2);
        }, green_controls);
        this.key_triggered_button("G+", ["l"], ()=>{
            let R = this.beyblades[0].materials.base.color;
            if(R[1] < 1)
                R[1] = Math.min(1, R[1] + 0.01);
        });

        this.new_line();
        this.key_triggered_button("B-", [","], ()=>{
            let R = this.beyblades[0].materials.base.color;
            if(R[2] > 0)
                R[2] = Math.max(0, R[2] - 0.01);
        });
        const blue_controls = this.control_panel.appendChild(document.createElement("span"));
        this.live_string(box => {
            box.textContent = "B: "+ this.beyblades[0].materials.base.color[2].toFixed(2);
        }, blue_controls);
        this.key_triggered_button("B+", ["."], ()=>{
            let R = this.beyblades[0].materials.base.color;
            if(R[2] < 2)
                R[2] = Math.min(1, R[2] + 0.01);
        });
        this.new_line();

        this.key_triggered_button("Volume-", ["v"], ()=>{
            Object.keys(this.audio).forEach((key) => {
                let V = this.audio[key].volume;
                if(V > 0)
                    this.audio[key].volume = Math.min(1, V - 0.01);
            });
         });
         const vol_controls = this.control_panel.appendChild(document.createElement("span"));
         this.live_string(box => {
             box.textContent = "Volume: "+ this.audio.bgm.volume.toFixed(2);
         }, vol_controls);
         this.key_triggered_button("Volume+", ["b"], ()=>{
            Object.keys(this.audio).forEach((key) => {
                let V = this.audio[key].volume;
                if(V < 1)
                    this.audio[key].volume = Math.min(1, V + 0.01);
            });
         });        
    }

    draw_beyblade(context,program_state,model_transform,base,top) {
        this.shapes.cone.draw(context,program_state,model_transform.times(Mat4.rotation(Math.PI/2,1,0,0)),base);
        this.shapes.cylinder.draw(context,program_state,model_transform.times(Mat4.translation(0,0.5,0).times(Mat4.scale(1.5,0.4,1.5)).times(Mat4.rotation(Math.PI/2,1,0,0))),top);
    }

    draw_arena(context,program_state,model_transform,texture) {
        model_transform = model_transform.times(Mat4.rotation(Math.PI / 2,1,0,0));
        model_transform = model_transform.times(Mat4.scale(10,10,1));
        this.shapes.arena.draw(context,program_state,model_transform,texture);
    }

    display(context, program_state) {
        const dt = program_state.animation_delta_time / 1000;

        super.display(context, program_state);

        this.draw_arena(context, program_state, this.beyarena.transform, this.materials.rock_texture);
        this.beyarena.update(dt);

        for(let i = 0; i < this.beyblades.length; i++)
        {
            this.draw_beyblade(context,program_state,this.beyblades[i].transform,
                this.beyblades[i].materials.base,
                this.beyblades[i].materials.top);

            let collider = this.beyblades[1-i].transform.times(vec4(0,0,0,1));
            this.beyblades[i].update(collider,dt,this.beyarena,this.audio.crash);
        }

        this.fire_transform = this.fire_transform.times(Mat4.rotation(dt * Math.PI / 6, 0, 1, 0));
        this.shapes.background.draw(context, program_state, this.fire_transform, this.materials.fire_texture);
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
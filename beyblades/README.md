# Team 15: Rayblades

### Intro:
Two beyblades start on a rocky arena, rotating around their axis and the center of the
arena. The beyblades will collide into each other, causing them to move in different
directions until one of them falls off. Source code can be found in beyblades/assignment2.js

### Instructions:
To set up the project, run server.py on the command line with python and navigate to localhost:8000.
Alternatively open the project in Webstorm and run index.html.
Use WASD to move the camera. Press R to reset the beyblades. Press J to make one of the
beyblades jump. Press U,I,K,L,<,> to control the color of the jumping beyblade.

### Details
The main function for the project is the beyblades.update() function, which determines where the beyblades
will be rendered in each frame. Within it are calculations for handling collisions, out of bounds detection, and
gravity when the beyblades jump.
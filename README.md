# Team 15: Rayblades

### Intro:
Two beyblades start on a rocky arena, rotating around their axis and the center of the
arena. The beyblades will collide into each other, causing them to move in different
directions until one of them falls off. Source code can be found in `beyblades/assignment2.js`

### Instructions:
The easiest way to access the project is here: https://rh5140.github.io/174a-beyblades/.
To set up the project, run `server.py` on the command line with python and navigate to `localhost:8000`.
Alternatively open the project in Webstorm and run `index.html`.
Use <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> to move the camera. Press <kbd>R</kbd> to reset the beyblades. Press <kbd>J</kbd> to make one of the
beyblades jump. Press <kbd>U</kbd> <kbd>I</kbd> <kbd>K</kbd> <kbd>L</kbd> <kbd><</kbd> <kbd>></kbd> to control the color of the jumping beyblade.

### Details
The main function for the project is the `beyblades.update()` function, which determines where the beyblades
will be rendered in each frame. Within it are calculations for handling collisions, out of bounds detection, and
gravity when the beyblades jump.

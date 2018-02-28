# Homework 4: L-systems

## Student Info

* Name: Mauricio Mutai
* PennKey: `mmutai`

## Demo

Click below to go to the demo!

[![](images/example.png)](maukmu.github.io/homework-4-l-systems-MauKMu)

(Plant created with 11 iterations, seed 25, default colors, non-default fruit, on commit `6bea555`)

## Controls

Below is an explanation of how to use the controls in the demo. A similar explanation of the controls can be accessed by clicking "Show Help" in the demo. Note that, unless otherwise specified, changes will only become visible if you redraw the plant using `Regenerate String and Plant` or `Redraw Plant`.

* `Light Position`: Changes the light position for shading. Updates automatically (redrawing plant is not needed).
* `iterations`: Changes number of times the string is expanded from its axiom.
* `randomMode`: Changes how "random" numbers are generated. The options are `Math.random()` and a deterministic seeded noise function. Using the seeded noise function is recommended if you want to redraw the same plant while tweaking other parameters, such as colors and fruit.
* `randomSeed`: Changes the seed for the deterministic seeded noise function.
* `woodColor`: Changes the color used for the wood geometry.
* `leafColor`: Changes the color for the leaf geometry.
* `fruit`: Changes which decoration is placed on the branches (some non-fruity decorations may require more determination).
* `Show Alphabet`: Shows L-system's alphabet.
* `Show String`: Shows current expanded L-system string.
* `Regenerate String and Plant`: Resets L-system string to axiom, re-expands it, then redraws plant.
* `Redraw Plant`: Redraws plant without modifying L-system string. Note that if your `randomMode` is `Math.random()`, you will get different results, although the general structure of the plant will still be the same. Similarly, using the seeded noise function and changing the seed will lead to different results.
* `Show Help`: Shows a help message.

## Techniques Used

### Overview

* In this demo, I use an L-system in order to place geometry in such a way that it resembles a plant. This geometry is rasterized with a standard WebGL workflow.
* The geometry is placed in one set of VBOs (including vertex positions, normals, and UV coordinates) so it can be rendered with just one draw call.
* I wanted to make a not-so-generic tree. I took inspiration from *araucárias*, a type of tree found in Brazil (as well as Argentina, Chile, and Australia, according to Wikipedia). I wanted to reproduce the unique shape created by their branches that gradually curve upwards as they get farther from the main trunk (see image below).
![](images/real-araucaria.jpg)
(Image taken from [here](http://www.mundohusqvarna.com.br/assunto/araucaria-e-possivel-combater-o-risco-de-extincao/))
* My final trees differ from *araucárias* in two significant points:
  * They have a base that twists around before righting itself up, instead of just going straight up from the base. This was the result of spending too much time Googling for "trees" and eventually finding "crooked trees", such as the one below. I wanted to reproduce these twisting trunks to give my L-system more variety.
![](images/crooked.jpg)
(Image taken from [here](http://www.youramazingplaces.com/incredible-photo-shoots-of-13-cool-places/))
  * They have fruit. Sometimes, the fruit isn't very fruity. They are models from ["Kirby's Return to Dream Land"](https://www.models-resource.com/wii/kirbysreturntodreamland/model/4572/).

### L-system Overview

Below is an explanation of what each symbol in the L-system does, and what they expand to (if they aren't terminal).

For this assignment, you will design a set of formal grammar rules to create
a plant life using an L-system program. Once again, you will work from a
Typescript / WebGL 2.0 base code like the one you used in homework 0. You will
implement your own set of classes to handle the L-system grammar expansion and
drawing. You will rasterize your L-system using faceted geometry. Feel free
to use ray marching to generate an interesting background, but trying to
raymarch an entire L-system will take too long to render!

## L-System Components
The way you implement your L-System is ultimately up to you, but we recommend
creating the following classes / constructs to help you instantiate, expand, and
draw your grammars:
* Some sort of expandable collection of string characters. You might implement
a linked list data structure, or you might use a basic Javascript array (which
is resizeable).
* Some sort of class to represent a Rule for expanding a character into a
string. You might consider creating a map within each Rule that maps
probabilities to strings, so that a Rule can represent multiple possible
expansions for a character with different probabilities.
* A second Rule-style class that dictates what drawing operation should be
performed when a character is parsed during the drawing process. This should
also be a map of probabilities, but this time the values in the map will be
functions rather than strings. Invoke a given function, e.g. `drawBranch`, when
a character is parsed.
* A Turtle class that lets you keep track of, at minimum, a position, an
orientation, and a depth. You should also create a stack onto which you can push
and pop turtle states.
* A class in which to store the VBOs that will represent __all__ of your faceted
geometry. __Do not draw individual mesh components one at a time. This will
cause your program to render very slowly.__ Instead, expand lists of vertex
information as you "draw" your grammar, and push all VBO data to the GPU at once
after you've finished parsing your entire string for drawing.

## OBJ loading
So that you can more easily generate interesting-looking plants, we ask that you
enable your program to import OBJ files and store their information in VBOs. You
can either implement your own OBJ parser, or use an OBJ-loading package via NPM:

[obj-mtl-loader](https://www.npmjs.com/package/obj-mtl-loader)

[webgl-obj-loader](https://www.npmjs.com/package/webgl-obj-loader)


## Aesthetic Requirements
Your plant must have the following attributes:
* It must grow in 3D
* It must have flowers, leaves, or some other branch decoration in addition to
basic branch geometry
* Organic variation (i.e. noise or randomness in grammar expansion)
* A flavorful twist. Don't just make a basic variation on the example broccoli
grammar from the slides! Create a plant that is unique to you!

Feel free to use the resources linked in the slides for inspiration!

## Interactivity
Using dat.GUI, make at least three aspects of your demo an interactive variable.
For example, you could modify:

* The axiom
* Your input grammar rules and their probability
* The angle of rotation of the turtle
* The size or color or material of the cylinder the turtle draws

Don't feel restricted to these examples; make any attributes adjustable that you
want!

## Examples from last year (Click to go to live demo)

Andrea Lin:

[![](andreaLin.png)](http://andrea-lin.com/Project3-LSystems/)

Tabatha Hickman:

[![](tabathaHickman.png)](https://tabathah.github.io/Project3-LSystems/)

Joe Klinger:

[![](joeKlinger.png)](https://klingerj.github.io/Project3-LSystems/)

## Extra Credit (Up to 20 points)
For bonus points, add functionality to your L-system drawing that ensures
geometry will never overlap. In other words, make your plant behave like a
real-life plant so that its branches and other components don't compete for the
same space. The more complex you make your L-system self-interaction, the more
points you'll earn.

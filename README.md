## CORELEO Javascript Library 
This library contains a set of utilities for working with strings, array, objects, etc. as well with JQuery UI and JQuery Mobile.
It incorporates fixes to UI items (such as making Select2 displayed correctly in JQuery dialog) which have not made it into the standard API for various reasons.
It also attempts to be transparent between desktop and mobile browsers and automatically handle UI usability and design issues between the two.  
For example calling dialog.open on a browser will display a dialog but in mobile browsers it will display a much more usable side panel.


### Want to build it?? ###
You can use the minified file or source file as is.  But if you 
want to make some changes and rebuild it, then follow the steps below.
<br>
*Skip step 1 if you already have gulp installed.
<br>
1. $ npm install --global gulp
<br>
2. $ npm install
<br>
3. $ gulp


### How do I use it? ###
* Take a look at the jsdoc in the doc/ directory.  
All of the modules listed can be executed as "coreleo.module_name.function_name"


### Issues? Who can I talk to? ###
* orrinsamaroo@gmail.com
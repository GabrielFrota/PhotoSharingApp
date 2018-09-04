This project is the implementation of the programming projects from Stanford's Web Applications course <br />

https://web.stanford.edu/class/cs142/
<br />

This class has a series of projects which are built on top of each other, and in the end you have a photo
sharing web application, something like an Instagram clone. I did this a while ago, when I was a beginner 
in Javascript and wanted to do something to get better. 
I learned a lot from it, but I was just starting and did a lot of very bad coding in it. 
I'm a lot better at Javascript right now, and web programming in general, so I'll be rewriting it to fix
the problems. File webServer.js is the node back-end, which is rewritten already. It gives a good ideia on how
I would write Javascript at the moment, and that's why I'm putting this project here. I'll start rewriting the 
front-end now, but it will probably take a while to finish it. To run the project follow the steps:

- MEAN stack needs to be installed and mongoDB running <br />
- clone the repository <br />
- npm install <br />
- node loadDatabase.js <br />
- node webServer.js <br />
- loadDatabase script inserts some initial users in the database. Their login credentials are their
lower case last name as username, and the string 'weak' as password. 
The initial users are <br />
["Malcolm", "Ripley", "Took", "Kenobi", "Ludgate", "Ousterhout"]

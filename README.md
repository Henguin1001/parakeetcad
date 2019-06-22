Javascript EDA software

The goal of this project is to create an PCB design software in Javascript
currently I have made a proof of concept to generate gerber files, but this
will need more refining.

I would like everything to work off xml, because it is easy to deserialize edit
and then reserialize. It is simple to search and modify using jquery (cheerio)
and should be simple to build a ui around.

I have added scripts that convert kicad libraries into xml, but the formatting  will change over the course of the project. It would be cool if components were templated and polymorphic, so that parts could be extended. All this would require a more human readable format so the xml will evolve to represent the data in a way that supports this.

TODO:
* split up the index.js into proper modules
* connect the xml components to the gerber generate functionality
* use grunt for task running (kicad->xml)
* add support for more layers
* add hand routing
* add auto routing

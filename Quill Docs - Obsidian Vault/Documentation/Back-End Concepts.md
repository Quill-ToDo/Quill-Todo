### Rails → Django
- From MVC (model-controller-view) to MVT (model-view-template)
	- Same idea, the names are just changed
 > Note: We are not using templates at all, our entire front-end is React

#### Admin Site
Django comes with a nice admin site to edit data: access by going to `<port number server is running on>/admin` in a browser.

#### API
Django also comes with a nice little API viewer to make easy queries. Access by going to `<port number server is running on>/API/tasks` in a browser. Look in the tasks url file for the endpoints.

### Postgres Database
We are using a PostgreSQL database for both development and production. This requires a little additional setup but it’s covered in contributing.md. Basically just need to install the DB and initialize a database in a certain way - we have a script that does this on windows at least and on Mac the script might work, the alternative is just recreating what the script does. Our tasks will not be synced between us. 
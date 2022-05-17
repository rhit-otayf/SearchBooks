var rhit = rhit || {};

rhit.FB_COLLECTION_CURRENTJOBS = "CurrentJobs";
rhit.FB_KEY_COMPANY = "company";
rhit.FB_KEY_MAJOR = "major";
rhit.FB_KEY_YEAR = "year";
rhit.FB_KEY_SUMMARY = "summary";
rhit.FB_KEY_LINK = "link";
rhit.FB_KEY_LAST_TOUCHED = "lastTouched";
rhit.FB_JOB_ID = "jobID"
rhit.fbCurrentJobsManager = null;
rhit.fbSingleQuoteManager = null;
rhit.counter = 0;


rhit.FbAuthManager = class {
	constructor() {
		this._user = null;
		this.major = null;
		this.sessionCount = 0;
		this.major = localStorage.getItem("major");
		this.year = localStorage.getItem("year");
	}
	ic() {
		this.sessionCount++;
	}
	beginListening(changeListener) {
		firebase.auth().onAuthStateChanged((user) => {
			this._user = user;
			changeListener();

		});
	}
	signIn() {

		Rosefire.signIn("14e53c40-2cca-445c-a5e3-ea970799a51b", (err, rfUser) => {
			if (err) {
				console.log("Rosefire error!", err);
				return;
			}
			console.log("Rosefire success!", rfUser);

			// TODO: Use the rfUser.token with your server.
			firebase.auth().signInWithCustomToken(rfUser.token)
				.catch((error) => {
					var errorCode = error.code;
					var errorMessage = error.message;
					console.log("existing account log inn error", errorCode, errorMessage);
				});

		});

	}
	addMajorYear(major, year) {
		localStorage.setItem("major", major);
		localStorage.setItem("year", year);
	}

	signOut() {
		firebase.auth().signOut().catch((error) => {
			console.log("sign out error");
		});
	}
	get isSignedIn() {
		return !!this._user
	}
	get uid() {
		return this._user.uid;
	}
}


rhit.LoginPageController = class {
	constructor() {
		rhit.startFirebaseUI();
		document.querySelector("#roseButton").onclick = (event) => {
			rhit.fbAuthManager.signIn();
		}

	}
}

function htmlToElement(html) {
	var template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}

rhit.Users = class {
	constructor(uid, major, year, array) {
		this.uid = uid;
		this.major = major;
		this.year = year;
		this.array = array;
	}
}
rhit.FbUsersManager = class {
	constructor() {
		this._documentSnapShots = [];
		this._ref = firebase.firestore().collection("Users");
		this._unsubscribe = null;
	}
	beginListening(changeListener) {
		console.log("Listening for users");
		this._unsubscribe = this._ref.onSnapshot((qs) => {
			this._documentSnapShots = qs.docs;
			console.log("The amount of users are " + this._documentSnapShots.length);
		});
	}
	getUsersIndex(index) {
		// const
	}
	add(user, jobID) {
		var test = false;
		var par = [];
		this._ref.where("author", "==", user).onSnapshot((s) => {
			if (s.docs.length == 0) {
				test = true;
				console.log("going to add the user");
				console.log(test);
				console.log("going to add the user");
				this._ref.add({
						["author"]: user,
						[rhit.FB_JOB_ID]: jobID,
					}).then(function (docRef) {
						console.log("Document written with ID: ", docRef.id);
					})
					.catch(function (error) {
						console.error("Error adding document: ", error);
					});
			}
		});

	}
	increment(JobID) {
		for (let i = 0; i < this._documentSnapShots.length; i++) {
			const doc = this._documentSnapShots[i]
			const id = doc.id;
			const arr = doc.get("jobID")
			console.log("hello", id);
			console.log("hello", doc.get("jobID"));

			console.log("getting uid by manager", rhit.fbAuthManager.uid);
			if (rhit.fbAuthManager.uid == doc.get("author")) {
				if (!arr.includes(JobID)) {
					arr.push(JobID);
				}
				this._ref.doc(id).update({
					["jobID"]: arr,
				});
			}
			console.log("hello", arr);
		}
	}
	// ref.onSnapshot((s)=>{
	// 	console.log(s.docs[0].id);
	// 	ref.doc(s.docs)



	// 	this._ref.update({
	// 			["count"]: old + 1,
	// 		}).then(function () {
	// 			console.log("Document has been updated");
	// 		})
	// 		.catch(function (error) {
	// 			console.error("Error adding document: ", error);
	// 		});
	// }


}






rhit.CurrentJobs = class {
	constructor(id, company, major, year, summary, link) {
		this.id = id;
		this.company = company;
		this.major = major;
		this.year = year;
		this.summary = summary;
		this.link = link;
	}
}

rhit.FbCurrentJobsManager = class {
	constructor(major, year) {
		this._documentSnapshots = [];
		this._unsubscribe = null;
		this.major = major;
		this.year = year;
		console.log(this.major, this.year);

		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_CURRENTJOBS);
	}
	beginListening(changeListener) {

		console.log("major for this lovely user is??", rhit.fbAuthManager.major);
		console.log("Listening for jobs");
		let query = this._ref.orderBy(rhit.FB_KEY_LAST_TOUCHED, "desc")
			.limit(50);
		if (rhit.fbAuthManager.major) {
			query = query.where(rhit.FB_KEY_MAJOR, "==", rhit.fbAuthManager.major)
				.where(rhit.FB_KEY_YEAR, "==", rhit.fbAuthManager.year);
			console.log("changing query to stuff is??", rhit.fbAuthManager.year);
		}

		this._unsubscribe = query.onSnapshot((querySnapshot) => {
			this._documentSnapshots = querySnapshot.docs;
			console.log("Updated " + this._documentSnapshots.length + " jobs.");
			if (changeListener) {
				changeListener();
			}

		});
	}

	stopListening() {
		this._unsubscribe();
	}
	addUser(author, jobId) {
		console.log(this._documentSnaphots);
	}
	add(company, major, year, summary, link) {
		this._ref.add({
				[rhit.FB_KEY_COMPANY]: company,
				[rhit.FB_KEY_MAJOR]: major,
				[rhit.FB_KEY_YEAR]: year,
				[rhit.FB_KEY_SUMMARY]: summary,
				[rhit.FB_KEY_LINK]: link,
				[rhit.FB_KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now(),
			})
			.then(function (docRef) {
				console.log("Document added with ID: ", docRef.id);
			})
			.catch(function (error) {
				console.error("Error adding document: ", error);
			});
	}

	update(id, company, major, year, summary, link) {}
	delete(id) {}
	get length() {
		return this._documentSnapshots.length;
	}
	getJobAtIndex(index) {
		const doc = this._documentSnapshots[index];
		return new rhit.CurrentJobs(doc.id, doc.get(rhit.FB_KEY_COMPANY), doc.get(rhit.FB_KEY_MAJOR),
			doc.get(rhit.FB_KEY_YEAR), doc.get(rhit.FB_KEY_SUMMARY), doc.get(rhit.FB_KEY_LINK));
	}
}

rhit.ListPageController = class {
	constructor() {

		rhit.fbCurrentJobsManager.beginListening(this.updateList.bind(this));
		rhit.fbUsersManager.beginListening(this.updateList.bind(this));


		$("#addJobDialog").on("show.bs.modal", () => {
			document.querySelector("#inputCompany").value = "";
			document.querySelector("#inputMajor").value = "";
			document.querySelector("#inputYear").value = "";
			document.querySelector("#inputSummary").value = "";
			document.querySelector("#inputLink").value = "";

		});


		$("#addJobDialog").on("shown.bs.modal", () => {
			document.querySelector("#inputCompany").focus();
		});

		document.querySelector("#submitAddJob").onclick = (event) => {
			const company = document.querySelector("#inputCompany").value;
			const major = document.querySelector("#inputMajor").value;
			const year = document.querySelector("#inputYear").value;
			const summary = document.querySelector("#inputSummary").value;
			const link = document.querySelector("#inputLink").value;
			console.log(company, major, year, summary, link);
			rhit.fbCurrentJobsManager.add(company, major, year, summary, link);
		};

		document.querySelector("#menuSignOut").onclick = (event) => {
			rhit.fbAuthManager.signOut();

		};
		document.querySelector("#menuSelection").onclick = (event) => {
			window.location.href = "/selector.html";
		};


	}
	updateList() {

		const newList = htmlToElement("<div id='jobListContainer'></div>")

		for (let k = 0; k < rhit.fbCurrentJobsManager.length; k++) {
			const job = rhit.fbCurrentJobsManager.getJobAtIndex(k);

			const newCard = this._createCard(job);

			newCard.onclick = (event) => {
				console.log(` Save the id ${job.id} then change pages`);
				console.log(` Save the id ${job.id} then change pages`);

				window.open(job.link, "popUpWindow");

				$('#appliedDialog').modal('show');
				document.querySelector("#submitApplied").onclick = (event) => {
					console.log(`the modal jbob id?? ${job.id}`);
					document.querySelector(`#${job.id}`).style.backgroundColor = "lightblue";
					rhit.fbUsersManager.increment(job.id);
					rhit.counter++;
					document.querySelector("#JobCount").innerHTML = `Jobs applied this session:  ${rhit.counter}`;
				}


			};
			newList.appendChild(newCard);

		}



		const oldList = document.querySelector("#jobListContainer");
		oldList.removeAttribute("id");
		oldList.hidden = true;
		oldList.parentElement.appendChild(newList);
	}

	_createCard(job) {
		return htmlToElement(`<div id="${job.id}" class="card">
		<div class="card-body">
			<h5 class="card-title">${job.company}</h5>
			<h6 class="card-subtitle mb-2 text-muted">${job.major}</h6>
			<h6 class="card-subtitle mb-2 text-muted">${job.year}</h6>
			<h6 class="card-subtitle mb-2 text-muted">${job.summary}</h6>
		</div>
	</div>`);
	}
}

rhit.SelectorPageController = class {
	constructor() {
		console.log("selector page u are on");
		console.log(rhit.fbAuthManager.uid, "u are logging uid");
		var ar = [];
		rhit.fbUsersManager.add(rhit.fbAuthManager.uid, ar);
		// rhit.fbSingleQuoteManager.beginListening(this.updateView.bind(this));
		document.querySelector("#selectorButton").onclick = (event) => {
			let major = document.querySelector("#majorS").value;
			let year = document.querySelector("#yearS").value;
			console.log(major, year);
			rhit.fbAuthManager.addMajorYear(major, year);
			rhit.fbCurrentJobsManager = new rhit.FbCurrentJobsManager(major, year);
			console.log(major, year, " eheheheheheheheh");
			window.location.href = "/list.html";
		}
	}

}
rhit.main = function () {
	console.log("Ready");
	rhit.fbAuthManager = new rhit.FbAuthManager();
	rhit.fbUsersManager = new rhit.FbUsersManager();
	rhit.fbAuthManager.beginListening(() => {
		console.log("isSignedIn = ", rhit.fbAuthManager.isSignedIn);
		rhit.checkforRedirects();
		rhit.initializePage();

	});
};
rhit.checkforRedirects = function () {
	if (document.querySelector("#loginPage") && rhit.fbAuthManager.isSignedIn) {
		window.location.href = "/selector.html";
	}
	if (!document.querySelector("#loginPage") && !rhit.fbAuthManager.isSignedIn) {
		window.location.href = "/";
	}

};
rhit.startFirebaseUI = function () {
	// FirebaseUI config.
	var uiConfig = {
		signInSuccessUrl: '/',
		signInOptions: [
			// Leave the lines as is for the providers you want to offer your users.
			firebase.auth.GoogleAuthProvider.PROVIDER_ID,
			firebase.auth.EmailAuthProvider.PROVIDER_ID,
			firebase.auth.PhoneAuthProvider.PROVIDER_ID,
			firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID
		],
		// tosUrl and privacyPolicyUrl accept either url string or a callback
		// function.
		// Terms of service url/callback.
		tosUrl: '<your-tos-url>',
		// Privacy policy url/callback.
		privacyPolicyUrl: function () {
			window.location.assign('<your-privacy-policy-url>');
		}
	};

	// Initialize the FirebaseUI Widget using Firebase.
	var ui = new firebaseui.auth.AuthUI(firebase.auth());
	// The start method will wait until the DOM is loaded.
	ui.start('#firebaseui-auth-container', uiConfig);
}

rhit.initializePage = function () {
	const urlParams = new URLSearchParams(window.location.search);
	rhit.fbCurrentJobsManager = null;

	if (document.querySelector("#listPage")) {
		console.log("u are on the list page");
		rhit.fbCurrentJobsManager = new rhit.FbCurrentJobsManager();
		const uid = urlParams.get("uid");
		console.log(rhit.fbAuthManager.uid);
		console.log(rhit.fbAuthManager);
		new rhit.ListPageController();
		//manuel shit
		this.ar = [];
		firebase.firestore().collection("Users").onSnapshot((s) => {
			this.ar = s.docs;
			console.log(this.ar.length);
			for (let i = 0; i < this.ar.length; i++) {
				console.log("qwpieurgipqwruvbreipvbirwevrwqepwrqipewqerpi");
				if (this.ar[i].get("author") == rhit.fbAuthManager.uid) {
					for (let k = 0; k < this.ar[i].get("jobID").length; k++) {
						if (document.getElementById(this.ar[i].get("jobID")[k])) {
							document.getElementById(this.ar[i].get("jobID")[k]).style.backgroundColor = "lightblue";
						}
					}
				}
			}



		});

		console.log("they shoudl be blue if we see this");
		console.log(this.ar.length)

	}

	if (document.querySelector("#SelectorPage")) {
		console.log("u are on the SELECTOR page");
		rhit.fbCurrentJobsManager = new rhit.FbCurrentJobsManager();
		new rhit.SelectorPageController();
	}
	if (document.querySelector("#loginPage")) {
		console.log("u are on the login page");

		new rhit.LoginPageController();
	}

};
rhit.main();
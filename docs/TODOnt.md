Things I currently don't plan to ever do (nothing is ever set in stone though)

- [ ] TONE.js (on hold, not needed so far)
	- [√] master volume
	- [ ] synth
	- [ ] sampler
	- [ ] sequencer data structures

- [-] auth back end (abandoned, went with firebase auth)
	- [ ] register
		- [√] save user to DB
		- [√] hash pw
		- [√] limit pw to 50 chars
		- [√] return token
		- [√] put token secret in secret place and load in
		- [√] check for existing user first
		- [√] min password length
		- [ ] validate email
			- [ ] on register, send email with verification link
		- [ ] verify email
	- [ ] login
		- [ ] return token
	- [ ] password reset
	- [ ] jwt
		- [ ] make it expire
		- [ ] do i need to store the tokens in the DB?
		- [ ] revoking access
		- [ ] logging out (just delete token from client?)

/* Minimal behavior: when called, insert the template's
	 `<div id="user-profile" class="user-profile">` node into the
	 app layout so it grows between the toolbar and footer.

	 This file intentionally only implements the mount/unmount API
	 the user requested. It does NOT change other files or wire
	 any save/avatar logic.
*/
(function(){
	const tplPath = 'containers/user_profile/user_profile.html';

	// No home detach/restore: this module will not remove or restore `#home-container`.

	async function loadTemplate(){
		const r = await fetch(tplPath);
		try { console.info('[user_profile:flag] loadTemplate fetched', { ok: r.ok, status: r.status, url: tplPath }); } catch(e){}
		if (!r.ok) throw new Error('Failed to load user profile template');
		const txt = await r.text();
		try { console.info('[user_profile:flag] loadTemplate length', { len: txt && txt.length }); } catch(e){}
		return txt;
	}

    
    // Ensure the profile stylesheet is loaded
	(function ensureProfileStyles() {
	try {
		const existing = document.querySelector('link[data-profile-styles]');
		if (!existing) {
			const l = document.createElement('link');
			l.rel = 'stylesheet';
			l.href = '/containers/user_profile/user_profile_styles.css';
			l.setAttribute('data-profile-styles', '1');
			document.head.appendChild(l);
			console.info('[user_profile:flag] profile stylesheet injected', { href: l.href });
		} else {
			try { console.info('[user_profile:flag] profile stylesheet already present', { href: existing.href }); } catch(e){}
		}
	} catch(e) { console.warn('[user_profile:flag] ensureProfileStyles failed', e); }
	})();

	// Small helper: open native date picker for an input (uses showPicker when available)
	function openNativeDatePickerFor(input) {
		if (!input) return;
		try {
			if (typeof input.showPicker === 'function') {
				input.showPicker();
				return;
			}
			// fallback: focus + click
			input.focus();
			input.click();
		} catch (e) {
			try { input.focus(); } catch (e) {}
		}
	}

	// Attach delegated handlers so clicking the decorative .date-icon opens the picker.
	function attachDateIconHandlers() {
		if (attachDateIconHandlers._attached) return;
		attachDateIconHandlers._attached = true;

		// Click handler: open picker when icon clicked
		document.addEventListener('click', (ev) => {
			try {
				const icon = ev.target.closest ? ev.target.closest('.date-icon') : null;
				if (!icon) return;
				const field = icon.closest('.date-field');
				if (!field) return;
				const input = field.querySelector('input[type="date"]');
				if (!input) return;
				ev.preventDefault();
				ev.stopPropagation();
				openNativeDatePickerFor(input);
			} catch (e) { /* ignore */ }
		}, true);

		// Keyboard accessibility: Enter/Space on the icon opens the picker
		document.addEventListener('keydown', (ev) => {
			try {
				const target = ev.target;
				if (!target || !target.classList) return;
				if (!target.classList.contains('date-icon')) return;
				if (ev.key === 'Enter' || ev.key === ' ') {
					ev.preventDefault();
					const field = target.closest('.date-field');
					const input = field && field.querySelector('input[type="date"]');
					openNativeDatePickerFor(input);
				}
			} catch (e) { /* ignore */ }
		}, true);
	}

	async function openUserProfile(){
		// 1) If the profile is already mounted, show it and return.
		// This keeps behavior idempotent when the user clicks Edit multiple times.
		const existing = document.getElementById('user-profile');
		try { if (existing) console.info('[user_profile:flag] existing mount detected', { computedDisplay: getComputedStyle(existing).display, inlineDisplay: existing.style ? existing.style.display : null, hasVisibleClass: existing.classList && existing.classList.contains('visible') }); } catch(e){}

		// If an existing mount is found, always attempt to re-assert visibility.
		if (existing) {
			try {
				if (!existing.classList || !existing.classList.contains('visible')) {
					try { existing.classList.add('visible'); } catch(e){}
				}
				if (existing.style && existing.style.display === 'none') {
					try { existing.style.removeProperty('display'); console.info('[user_profile:flag] cleared inline display from existing mount'); } catch(e){}
				}
				try { console.info('[user_profile:flag] existing mount after re-show computedDisplay', getComputedStyle(existing).display); } catch(e){}
				requestAnimationFrame(() => { try { console.info('[user_profile:flag] existing rAF computedDisplay', getComputedStyle(existing).display); } catch(e){} });
				setTimeout(() => { try { console.info('[user_profile:flag] existing timeout(60ms) computedDisplay', getComputedStyle(existing).display); } catch(e){} }, 60);

				// Attempt to re-populate fields when re-showing an existing mount.
				try {
					if (typeof window.populateUserProfile === 'function') {
						console.info('[user_profile:flag] calling window.populateUserProfile for existing mount');
						window.populateUserProfile().then(() => {
							console.info('[user_profile:flag] window.populateUserProfile finished for existing mount');
						}).catch(err => {
							console.warn('[user_profile:flag] window.populateUserProfile rejected for existing mount', err);
						});
					} else {
						console.info('[user_profile:flag] window.populateUserProfile not available for existing mount');
					}
				} catch (e) { console.warn('[user_profile:flag] error invoking window.populateUserProfile', e); }
			} catch (e) { console.warn('[user_profile:flag] failed to re-show existing mount', e); }
		}

		// Intentionally do not manipulate `#home-container` here. If the
		// home view should be hidden or unmounted, that is handled elsewhere
		// by the app shell or router. Leaving `#home-container` untouched
		// avoids fragile DOM parent/nextSibling restore logic.

		// If already mounted, reuse it; otherwise load and insert the template.
		let mount = existing || null;
		if (!mount) {
			try{
				console.info('[user_profile:flag] creating new mount - calling loadTemplate');
				const html = await loadTemplate();
				console.info('[user_profile:flag] loadTemplate returned', { htmlLen: html && html.length });
				const frag = document.createRange().createContextualFragment(html);
				// prefer template's own root with class user-profile or id user-profile
				mount = frag.querySelector('#user-profile.user-profile') || frag.querySelector('.user-profile') || frag.firstElementChild;
				if (!mount){
					mount = document.createElement('div');
					mount.id = 'user-profile';
					mount.className = 'user-profile';
					while(frag.firstChild) mount.appendChild(frag.firstChild);
					console.info('[user_profile:flag] created fallback mount element');
				}
				try { console.info('[user_profile:flag] selected mount element', { id: mount.id, class: mount.className }); } catch(e){}

				// 3) Insert the template root into the main layout so it participates
				// in the page's flex layout (grows between toolbar and footer).
				const main = document.getElementById('main-container') || document.body;
				const footer = document.getElementById('footer-container');
				try {
					if (footer && footer.parentNode === main) {
						main.insertBefore(mount, footer);
						console.info('[user_profile:flag] inserted mount before footer', { mainId: main.id || null, footerId: footer.id || null });
					} else {
						main.appendChild(mount);
						console.info('[user_profile:flag] appended mount to main', { mainId: main.id || null });
					}
				} catch (e) {
					console.warn('[user_profile:flag] insertion into main failed - falling back to body append', e);
					document.body.appendChild(mount);
				}

				// Ensure the mounted profile is visible immediately. Some navigation
				// flows load CSS after DOM insertion which can leave the element
				// computed as display:none. Add the 'visible' class and clear any
				// inline display to avoid the first-click invisible panel.
				try {
					mount.classList.add('visible');
					if (mount.style && mount.style.display === 'none') {
						try { console.info('[user_profile:flag] removing inline display:none from mount'); } catch(e){}
						mount.style.removeProperty('display');
					}
					try { console.info('[user_profile:flag] after add visible immediate computedDisplay', getComputedStyle(mount).display); } catch(e){}
					requestAnimationFrame(() => { try { console.info('[user_profile:flag] rAF computedDisplay', getComputedStyle(mount).display); } catch(e){} });
					setTimeout(() => { try { console.info('[user_profile:flag] timeout(60ms) computedDisplay', getComputedStyle(mount).display); } catch(e){} }, 60);
				} catch (e) { /* non-fatal */ }

				// Load translation strings if a loader exists, then translate any
				// `data-i18n` attributes inside the mounted template so labels and
				// headings come from `language_strings.json` via `getString()`.
				// Translate mounted template and wire language change handling
				async function translateUserProfile(rootEl){
					if (!rootEl) rootEl = document.getElementById('user-profile');
					if (!rootEl) return;
					if (typeof loadStrings === 'function') {
						try { await loadStrings(); } catch (e) { console.warn('loadStrings failed in translateUserProfile', e); }
					}
					try {
						const transEls = rootEl.querySelectorAll('[data-i18n]');
						transEls.forEach(el => {
							const key = el.getAttribute('data-i18n');
							if (key && typeof getString === 'function') {
								try {
									const txt = getString(key);
									if (txt) el.textContent = txt;
								} catch (e) { console.warn('getString failed for', key, e); }
							}
						});
					} catch (e) {
						console.warn('user_profile: translation failed', e);
					}
				}

				// Run initial translation for the mounted profile
				await translateUserProfile(mount);

				// Populate fields with user data when mounted
				async function populateUserProfile(profile) {
					try {
						let data = profile || null;
						try { console.info('[user_profile:flag] populateUserProfile start', { haveProfileArg: !!profile, haveWindowCurrentProfileData: !!window.currentProfileData, haveSupabase: !!window.supabase, haveWindowCurrentUser: !!window.currentUser }); } catch(e){}

						// If no profile passed, try to fetch from Supabase using currentUser
						const user = window.currentUser || null;
						// resolve id from window.currentUser if possible
						let id = null;
						if (user) {
							try { id = user.id || user.user?.id || user.sub || user.uid || null; } catch(e) { id = null; }
							try { console.info('[user_profile:flag] resolved id from window.currentUser', { id }); } catch(e){}
						}

						// If no id yet, try supabase session fallback
						if (!id && window.supabase && window.supabase.auth && typeof window.supabase.auth.getSession === 'function') {
							try {
								const sess = await window.supabase.auth.getSession();
								id = sess?.data?.session?.user?.id || sess?.data?.user?.id || null;
								try { console.info('[user_profile:flag] derived id from supabase.auth.getSession', { id }); } catch(e){}
							} catch (e) { console.warn('[user_profile:flag] supabase.auth.getSession failed', e); }
						}

						// If no data and we have an id + supabase, query profiles
						if (!data && id && window.supabase) {
							try {
								const { data: p, error } = await window.supabase
									.from('profiles')
									.select('*')
									.eq('id', id)
									.single();
								try { console.info('[user_profile:flag] supabase profiles query result', { id, hasData: !!p, error: error ? (error.message || error) : null }); } catch(e){}
								if (!error && p) data = p;
							} catch (e) { console.warn('[user_profile:flag] supabase query exception', e); }
						} else {
							try { if (!data) console.info('[user_profile:flag] skipping supabase query', { id, haveSupabase: !!window.supabase }); } catch(e){}
						}

						// Fallback to window-stored profileData if present
						if (!data && window.currentProfileData) {
							try { console.info('[user_profile:flag] using window.currentProfileData fallback', { hasData: !!window.currentProfileData }); } catch(e){}
							data = window.currentProfileData;
						}

						// If we have data, populate fields
						if (!data) {
							try { console.warn('[user_profile:flag] no profile data available after fallbacks', { id }); } catch(e){}
							return;
						}

						const setText = (sel, value) => {
							if (value === undefined || value === null) {
								try { console.info('[user_profile:flag] setText skipped (no value)', { sel, value }); } catch(e){}
								return;
							}
							const el = mount.querySelector(sel) || document.querySelector(sel);
							if (!el) { try { console.info('[user_profile:flag] setText element not found', { sel, value }); } catch(e){}; return; }
							try {
								if ('value' in el) el.value = value;
								else el.textContent = value;
								try { console.info('[user_profile:flag] setText applied', { sel, value }); } catch(e){}
							} catch(e) { console.warn('[user_profile:flag] setText failed', { sel, value, err: e }); }
						};

						setText('#email-static', data.email || user?.email || '');
						setText('#full_name', data.full_name || `${data.first_name||''} ${data.last_name||''}`.trim());
						setText('#first_name', data.first_name || '');
						setText('#last_name', data.last_name || '');
						setText('#reports_to_email', data.reports_to_email || '');
						setText('#date_hired', data.date_hired || data.dateHired || '');
						setText('#department', data.department || '');
						setText('#phone', data.phone || '');
						setText('#birthdate', data.birthdate || '');
						setText('#role', data.role || '');

						// Language select
						try {
							const langEl = mount.querySelector('#language') || document.querySelector('#language');
							if (langEl && data.language) {
								langEl.value = data.language;
							}
						} catch (e) { /* ignore */ }

						// Avatar: inject avatar.html module into the profile slot and initialize it
						try {
							const avatarSlot = mount.querySelector('#avatar-slot') || mount.querySelector('#profile-avatar');
							let avatarUrl = null;
							if (window.AvatarStore && typeof window.AvatarStore.getImage === 'function') {
								avatarUrl = window.AvatarStore.getImage();
							}
							if (!avatarUrl && data && data.avatar_url) avatarUrl = data.avatar_url;

							if (!avatarSlot) {
								console.warn('user_profile: no avatar slot found to inject avatar.html');
							} else {
								const avatarHtmlCandidates = [
									'global/avatar/avatar.html',
									'/global/avatar/avatar.html',
									'global/avatar/avatar.html'
								];
								let injected = false;
								for (const p of avatarHtmlCandidates) {
									try {
										const resp = await fetch(p, { cache: 'no-store' });
										if (!resp.ok) continue;
										const avatarHtml = await resp.text();
										avatarSlot.innerHTML = avatarHtml;

										// initialize avatar module on injected markup
										try {
											if (typeof window.setupAvatarUpload === 'function') {
												const placeholder = avatarSlot.querySelector('#avatar-placeholder') || avatarSlot.querySelector('.avatar-placeholder') || avatarSlot.querySelector('[data-avatar-placeholder]');
												const input = avatarSlot.querySelector('input[type="file"]') || avatarSlot.querySelector('#avatar-file-input') || avatarSlot.querySelector('[data-avatar-input]');
												if (placeholder && input) {
													// setupAvatarUpload expects string IDs (it uses document.getElementById)
													try {
														const phId = placeholder.id || (placeholder.id = 'avatar-placeholder');
														const inId = input.id || (input.id = 'avatar-file-input');
														try {
															window.setupAvatarUpload(phId, inId, avatarSlot);
														} catch (err) {
															console.warn('user_profile: setupAvatarUpload failed with ids', phId, inId, err);
														}
													} catch (err) {
														console.warn('user_profile: failed to prepare avatar ids', err);
													}
												} else {
													try {
														// ensure fallback elements have ids before calling the initializer
														const ph = avatarSlot.querySelector('#avatar-placeholder') || avatarSlot.querySelector('.avatar-placeholder');
														const inp = avatarSlot.querySelector('#avatar-file-input') || avatarSlot.querySelector('input[type="file"]');
														if (ph && inp) {
															if (!ph.id) ph.id = 'avatar-placeholder';
															if (!inp.id) inp.id = 'avatar-file-input';
															window.setupAvatarUpload('avatar-placeholder', 'avatar-file-input', avatarSlot);
														} else {
															try { window.setupAvatarUpload('avatar-placeholder', 'avatar-file-input', avatarSlot); }
															catch (e) { console.warn('user_profile: setupAvatarUpload init failed (no elements)', e); }
														}
													} catch(e){ console.warn('user_profile: setupAvatarUpload init failed', e); }
												}
											}
										}
										catch (e) { console.warn('user_profile: avatar init error after injecting html', e); }

										// push avatar URL into AvatarStore if available so widget shows it
										try {
											if (avatarUrl && window.AvatarStore && typeof window.AvatarStore.setImage === 'function') {
												window.AvatarStore.setImage(avatarUrl);
											}
										} catch (e) { /* non-fatal */ }

										injected = true;
										break;
									} catch (e) {
										// ignore and try next candidate
									}
								}

								if (!injected) {
									console.warn('user_profile: avatar.html not found; creating minimal controls');
									avatarSlot.innerHTML = '';
									const placeholder = document.createElement('div');
									placeholder.id = 'profile-avatar-placeholder';
									placeholder.className = 'avatar-placeholder';
									const input = document.createElement('input');
									input.type = 'file';
									input.accept = 'image/*';
									input.id = 'profile-avatar-input';
									input.style.display = 'none';
									avatarSlot.appendChild(placeholder);
									avatarSlot.appendChild(input);

									if (typeof window.setupAvatarUpload === 'function') {
										try { window.setupAvatarUpload('profile-avatar-placeholder', 'profile-avatar-input', avatarSlot); }
										catch (e) { console.warn('user_profile: setupAvatarUpload failed in fallback', e); }
										try {
											if (avatarUrl && window.AvatarStore && typeof window.AvatarStore.setImage === 'function') {
												window.AvatarStore.setImage(avatarUrl);
											}
										} catch (e) { /* non-fatal */ }
									}
								}
							}
						} catch (e) { console.warn('user_profile: avatar initialization failed', e); }
					} catch (err) {
						console.warn('populateUserProfile failed', err);
					}
				}

				// Expose for manual refresh
				try { window.populateUserProfile = populateUserProfile; } catch (e) {}

				// Run populate once on mount
				try { await populateUserProfile(); } catch (e) { console.warn('Initial populateUserProfile failed', e); }
				// Ensure date icon handlers are attached so the decorative icon opens the native picker
				try { attachDateIconHandlers(); } catch (e) { /* ignore */ }

				// Listen for global language changes and re-run translations
				try {
					window.addEventListener('languageChanged', async () => {
						try { await translateUserProfile(document.getElementById('user-profile')); } catch (e) { console.warn('translateUserProfile failed on languageChanged', e); }
					});
				} catch (e) { console.warn('Failed to attach languageChanged listener in user_profile', e); }

				// Wire the language <select> inside the profile so changes take effect immediately
				try {
					const langSelect = mount.querySelector('#language');
					if (langSelect) {
						// set initial value from current language
						if (typeof getLanguage === 'function') {
							try { langSelect.value = getLanguage(); } catch (e) { /* ignore */ }
						}
						langSelect.addEventListener('change', (ev) => {
							try { localStorage.setItem('language_chosen_by_user', '1'); } catch (e) { /* ignore */ }
							if (typeof setLanguage === 'function') setLanguage(ev.target.value);
						});
					}
				} catch (e) { console.warn('Failed to wire language selector in user_profile', e); }

				// Note: styling (flex behavior) is handled by the container stylesheet.
			} catch(err){ console.error('openUserProfile failed', err); return; }
		}

			// Attach cancel handler so clicking Cancel closes the profile.
			try{
				const cancel = mount.querySelector('#user-profile-cancel, .btn-cancel');
				if (cancel && !cancel.dataset._closeBound){
					cancel.addEventListener('click', (ev)=>{ ev.preventDefault(); closeUserProfile(); });
					cancel.dataset._closeBound = '1';
				}
			} catch(e){ /* silent */ }

			// Attach save handler so clicking Save persists profile and closes the panel.
			try{
				const save = mount.querySelector('#user-profile-save, .btn-save');
				if (save && !save.dataset._saveBound){
					save.addEventListener('click', async (ev)=>{
						ev.preventDefault();
						if (save.disabled) return;
						save.disabled = true;
						const oldText = save.textContent;
						try{
							// Collect fields from the mounted template
							const get = sel => {
								const el = mount.querySelector(sel) || document.querySelector(sel);
								return el ? (el.value !== undefined ? el.value : el.textContent) : null;
							};
							const update = {
								full_name: get('#full_name') || null,
								first_name: get('#first_name') || null,
								last_name: get('#last_name') || null,
								language: (mount.querySelector('#language') && mount.querySelector('#language').value) || null,
								date_hired: get('#date_hired') || null,
								department: get('#department') || null,
								phone: get('#phone') || null,
								birthdate: get('#birthdate') || null,
								role: get('#role') || null,
								reports_to_email: get('#reports_to_email') || null
							};

							// Debug: log the collected update payload so console shows activity when Save is clicked
							try { console.info('user_profile: save clicked', Object.assign({}, update)); } catch(e) { /* ignore */ }

							// Clean nulls (supabase doesn't like undefined in updates)
							Object.keys(update).forEach(k => { if (update[k] === null) delete update[k]; });

							// Attempt to capture avatar preview from instance or AvatarStore
							try{
								let avatarVal = null;
								const avatarSlot = mount.querySelector('#avatar-slot') || mount.querySelector('#profile-avatar');
								if (avatarSlot && avatarSlot.__avatarWidget && typeof avatarSlot.__avatarWidget.getImage === 'function') {
									avatarVal = avatarSlot.__avatarWidget.getImage();
								} else if (window.AvatarStore && typeof window.AvatarStore.getImage === 'function') {
									avatarVal = window.AvatarStore.getImage();
								}
								if (avatarVal) update.avatar_url = avatarVal;
							} catch(e){ console.warn('user_profile: failed to read avatar preview', e); }

							// If supabase is available, persist the profile row
							let prevReports = null;
							if (window.supabase && window.currentUser) {
								try{
									const id = window.currentUser.id || window.currentUser.user?.id || window.currentUser.sub || window.currentUser.uid;
									if (!id) throw new Error('no-user-id');
									// Attempt to read current reports_to_email before update so we can detect changes
									try {
										const { data: existingProfile, error: fetchErr } = await window.supabase
											.from('profiles')
											.select('reports_to_email')
											.eq('id', id)
											.single();
										if (!fetchErr && existingProfile) prevReports = existingProfile.reports_to_email || null;
									} catch (e) { /* non-fatal */ }

									if (Object.keys(update).length > 0) {
										const { data: updated, error } = await window.supabase
											.from('profiles')
											.update(update)
											.eq('id', id)
											.single();
										if (error) throw error;
									}
									// If language changed in profile, update languageFromProfile
									try { if (update.language && typeof updateLanguageFromProfile === 'function') updateLanguageFromProfile(update.language); } catch(e){}
								} catch(err){
									console.error('Failed to save profile', err);
									alert('Failed to save profile: ' + (err.message||err));
									return;
								}
							} else {
								// If supabase not present, store on window for manual inspection
								window.currentProfileData = Object.assign(window.currentProfileData||{}, update);
							}
							// Notify manager about update (best-effort, non-blocking) only if reports_to changed
							try {
								const managerEmail = update.reports_to_email || null;
								const changed = (managerEmail && String(managerEmail || '') !== String(prevReports || ''));
								if (changed) {
									(async () => {
										// Send a manager request to the server (best-effort). Build payload then log non-sensitive fields.
										const payload = {
											manager_email: managerEmail,
											user_id: window.currentUser && (window.currentUser.id || window.currentUser.user?.id),
											userName: update.full_name || `${update.first_name||''} ${update.last_name||''}`.trim(),
											managerName: '',
											company: window.APP_COMPANY_NAME || 'Rhomberg'
										};
										try { console.info('manager-requests: preparing payload', { manager_email: payload.manager_email, user_id: payload.user_id }); } catch(e){}

										// Try server create first
										try {
											// Prefer retrieving a fresh access token from Supabase client if available
											let token = null;
											try {
												if (window.supabase && window.supabase.auth) {
													if (typeof window.supabase.auth.getSession === 'function') {
														const s = await window.supabase.auth.getSession();
														token = s?.data?.session?.access_token || null;
													} else if (typeof window.supabase.auth.session === 'function') {
														token = window.supabase.auth.session()?.access_token || null;
													}
												}
											} catch (e) { /* ignore and fallback */ }
											// Fallback to any legacy currentUser token if present
											if (!token && window.currentUser) token = window.currentUser.access_token || window.currentUser.user?.access_token || null;

											const headers = { 'Content-Type': 'application/json' };
											if (token) headers['Authorization'] = 'Bearer ' + token;
											const res = await fetch('/api/manager-requests', { method: 'POST', headers, body: JSON.stringify(payload) });
											try { console.info('manager-requests: sent fetch, awaiting response', { url: '/api/manager-requests', method: 'POST' }); } catch(e){}
											const text = await res.text().catch(() => '');
											let parsed = null;
											try { parsed = JSON.parse(text); } catch (e) { parsed = null; }
											console.info('manager-requests: server response', { status: res.status, body: parsed || text.slice(0,300) });
											if (!res.ok) throw new Error('server_failed');
											console.log('manager request created via server');
										} catch (err) {
											// fallback to client email
											try {
												if (managerEmail && window.emailClient && typeof window.emailClient.sendManagerNotification === 'function') {
													window.emailClient.sendManagerNotification({
														recipient_email: managerEmail,
														subject: (typeof getString === 'function') ? getString('emails.manager_notification.subject') : 'You have a new report',
														templateName: 'manager_notification',
														templateData: payload
													}).then(res => {
														console.log('manager notification queued (fallback):', res && (res.ok || res.status) ? res : 'unknown');
													}).catch(err => { console.warn('manager notification failed (fallback):', err); });
												}
											} catch (e) { console.warn('manager notification fallback failed', e); }
										}
									})();
								}
							} catch (e) { /* non-fatal */ }

														// Close profile after successful save
														try { closeUserProfile(); } catch(e){ /* ignore */ }
						} finally {
							save.disabled = false;
							save.textContent = oldText;
						}
					});
					save.dataset._saveBound = '1';
				}
			} catch(e){ console.warn('Failed to attach save handler in user_profile', e); }

		// Add the shared scrollbar class so the profile body uses global scrollbar styling.
		try{
			const body = mount.querySelector('.user-profile-body');
			if (body && !body.classList.contains('app-scrollbar')){
				body.classList.add('app-scrollbar');
			}
		} catch(e){ /* silent */ }

		// Enable/disable Save button based on whether form has unsaved changes
		try {
			const monitoredFields = ['#full_name','#first_name','#last_name','#language','#date_hired','#department','#phone','#birthdate','#role','#reports_to_email'];
			function readSnapshot(){
				const snap = {};
				monitoredFields.forEach(sel => {
					const el = mount.querySelector(sel) || document.querySelector(sel);
					let v = null;
					if (el) v = (el.value !== undefined ? el.value : el.textContent);
					if (v === undefined || v === null) v = '';
					snap[sel] = String(v);
				});
				// include avatar preview as part of dirty check if AvatarStore present
				try { snap['_avatar'] = (window.AvatarStore && typeof window.AvatarStore.getImage === 'function') ? (window.AvatarStore.getImage()||'') : ''; } catch(e){ snap['_avatar']=''; }
				return snap;
			}

			function snapshotsEqual(a,b){
				const ka = Object.keys(a||{}), kb = Object.keys(b||{});
				if (ka.length !== kb.length) return false;
				for (const k of ka){ if (String(a[k]||'') !== String(b[k]||'')) return false; }
				return true;
			}

			let initialSnapshot = readSnapshot();
			const saveBtn = mount.querySelector('#user-profile-save, .btn-save');
			function updateSaveState(){
				try{
					const now = readSnapshot();
					const dirty = !snapshotsEqual(initialSnapshot, now);
					if (saveBtn) saveBtn.disabled = !dirty;
					return dirty;
				} catch(e){ return true; }
			}

			// Attach change listeners once per mount
			if (!mount.dataset._changeTracking){
				mount.addEventListener('input', (ev)=>{ try { updateSaveState(); } catch(e){} }, true);
				mount.addEventListener('change', (ev)=>{ try { updateSaveState(); } catch(e){} }, true);
				// listen for avatar updates
				try { window.addEventListener('avatarUpdated', updateSaveState); window.addEventListener('avatarPreviewChanged', updateSaveState); } catch(e){}
				mount.dataset._changeTracking = '1';
			}

			// Initialize Save button state (disabled when no changes)
			try { if (saveBtn) saveBtn.disabled = !updateSaveState(); } catch(e){}
		} catch(e){ console.warn('user_profile: failed to setup dirty-check for Save button', e); }
	}

	function closeUserProfile(){
		// Remove the mounted profile root from the DOM.
		const node = document.getElementById('user-profile');
		if (node) node.remove();

		// No restoration of `#home-container` is necessary as it is not detached.
	}

	// Expose minimal API expected by the app
	window.openUserProfile = openUserProfile;
	window.closeUserProfile = closeUserProfile;

	// Do not auto-open; just provide the API.
})();



import os

file_path = r'c:\xampp\htdocs\v pfe\DarLink-main\client\Register.html'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

import re

# Replace HTML Form
html_form_new = r"""
    <!-- Progress Bar -->
    <div class="wizard-progress" style="margin-bottom: 24px; text-align: center;">
        <div style="font-size: 0.85rem; font-weight: 600; color: #8e8e93; margin-bottom: 8px;">Step <span id="stepCounter">1</span> of 3</div>
        <div class="progress" style="height: 6px; background: rgba(0,0,0,0.1); border-radius: 3px; overflow: hidden; display: flex;">
            <div id="wizardProgressBar" style="width: 33.33%; height: 100%; background: var(--primary); transition: width 0.4s ease;"></div>
        </div>
    </div>

    <form id="registerForm" enctype="multipart/form-data">
        
        <!-- STEP 1: Name and Type -->
        <div class="wizard-step" id="step1">
            <label><span data-i18n="register_user_type_label">User Type</span><span class="required-star">*</span></label>
            <div class="user-type-container">
                <button type="button" class="user-btn" onclick="selectUserType('Renter')" data-i18n="register_renter_btn">Renter</button>
                <button type="button" class="user-btn" onclick="selectUserType('Owner')" data-i18n="register_owner_btn">Owner</button>
            </div>
            <input type="hidden" id="UserType" required>
            <div id="step1TypeError" style="color:red; font-size:12px; margin-top:-10px; margin-bottom:10px; display:none;">Please select a user type.</div>

            <label><span data-i18n="register_firstname_label">First Name</span><span class="required-star">*</span></label>
            <input type="text" id="FirstName" name="first_name" placeholder="Enter your first name" data-i18n-placeholder="register_firstname_placeholder" required>
            <div id="firstNameValidation" class="validation-message" style="font-size: 13px; margin-top: -10px; margin-bottom: 10px;"></div>

            <label><span data-i18n="register_lastname_label">Last Name</span><span class="required-star">*</span></label>
            <input type="text" id="LastName" name="last_name" placeholder="Enter your last name" data-i18n-placeholder="register_lastname_placeholder" required>
            <div id="lastNameValidation" class="validation-message" style="font-size: 13px; margin-top: -10px; margin-bottom: 10px;"></div>

            <button type="button" class="wizard-next-btn" onclick="goToStep(2)" style="width: 100%; padding: 14px; background: var(--primary); color: #fff; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; margin-top: 10px; font-size: 1rem;">Next</button>
        </div>

        <!-- STEP 2: Contact & Security -->
        <div class="wizard-step" id="step2" style="display: none;">
            <label><span data-i18n="register_email_label">Email</span><span class="required-star">*</span></label>
            <input type="email" id="Email" placeholder="Enter your email" data-i18n-placeholder="register_email_placeholder" required>
            <div id="emailValidation" class="validation-message" style="font-size: 13px; margin-top: -10px; margin-bottom: 10px;"></div>

            <label><span data-i18n="register_phone_label">Phone Number</span><span class="required-star">*</span></label>
            <input type="tel" id="PhoneNumber" placeholder="Enter your phone number" data-i18n-placeholder="register_phone_placeholder" required>
            <div id="phoneValidation" class="validation-message" style="font-size: 13px; margin-top: -10px; margin-bottom: 10px;"></div>

            <label><span data-i18n="register_password_label">Password</span><span class="required-star">*</span></label>
            <div class="password-container">
                <input type="password" id="Password" minlength="6" placeholder="Minimum 6 characters" data-i18n-placeholder="register_password_placeholder" required>
                <span class="toggle-password" onclick="togglePasswordVisibility('Password', this)"><i class="fa fa-eye"></i></span>
            </div>

            <div id="passwordMessage" style="display: none; background: rgba(255,255,255,0.1); padding: 10px; border-radius: 8px; margin-bottom: 15px;">
                <p style="margin: 0 0 5px 0; font-size: 13px;">Password must contain:</p>
                <p id="letter" class="invalid" style="margin: 2px 0; font-size: 12px; color: red;">✓ A <b>lowercase</b> letter</p>
                <p id="capital" class="invalid" style="margin: 2px 0; font-size: 12px; color: red;">✓ An <b>uppercase</b> letter</p>
                <p id="number" class="invalid" style="margin: 2px 0; font-size: 12px; color: red;">✓ A <b>number</b></p>
                <p id="length" class="invalid" style="margin: 2px 0; font-size: 12px; color: red;">✓ Minimum <b>8 characters</b></p>
            </div>

            <label><span data-i18n="register_confirm_password_label">Confirm Password</span><span class="required-star">*</span></label>
            <div class="password-container">
                <input type="password" id="ConfirmPassword" minlength="6" placeholder="Re-enter your password" data-i18n-placeholder="register_confirm_password_placeholder" required>
                <span class="toggle-password" onclick="togglePasswordVisibility('ConfirmPassword', this)"><i class="fa fa-eye"></i></span>
            </div>
            <div id="confirmPasswordValidation" class="validation-message" style="font-size: 13px; margin-top: -10px; margin-bottom: 10px;"></div>

            <div style="display:flex; gap:10px; margin-top: 10px;">
                <button type="button" class="wizard-back-btn" onclick="goToStep(1)" style="flex:1; padding: 14px; background: rgba(0,0,0,0.1); color: var(--text); border: 1px solid rgba(0,0,0,0.1); border-radius: 12px; font-weight: 600; cursor: pointer; font-size: 1rem;">Back</button>
                <button type="button" class="wizard-next-btn" onclick="goToStep(3)" style="flex:1; padding: 14px; background: var(--primary); color: #fff; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; font-size: 1rem;">Next</button>
            </div>
        </div>

        <!-- STEP 3: Verification (Optional OCR ID) -->
        <div class="wizard-step" id="step3" style="display: none;">
            <label><span data-i18n="register_id_images_label">ID Card Image (Front Side)</span></label>
            <div class="note" data-i18n="register_id_note">Upload a clear photo of the front of your ID card (Optional)</div>
            <div class="id-upload">
                <div class="upload-box" id="frontBox">
                    <h4 data-i18n="register_front_side">Front Side</h4>
                    <input type="file" id="IDCardFront" accept="image/*">
                    <label for="IDCardFront" class="file-label" data-i18n="register_upload_btn">📤 Click to Upload</label>
                    <div class="preview" id="frontPreview"><img id="frontImg" alt="Front"></div>
                </div>
            </div>

            <div id="ocrStatus" class="ocr-status">
                <div id="ocrText" data-i18n="register_scanning">Scanning...</div>
                <div class="progress" style="margin-bottom: 0px;"><div class="progress-bar" id="progressBar"></div></div>
            </div>

            <label><span data-i18n="register_id_number_label">ID Card Number</span><span class="required-star">*</span></label>
            <div class="note" data-i18n="register_id_number_note">Will be extracted automatically from front image</div>
            <input type="text" id="IDCardNumber" placeholder="18 digits" data-i18n-placeholder="register_id_number_placeholder" required readonly>
            <button type="button" id="manualBtn" data-i18n="register_manual_btn">✏️ Edit Manually</button>
            
            <div style="display:flex; gap:10px; margin-top: 20px;">
                <button type="button" class="wizard-back-btn" onclick="goToStep(2)" style="flex:1; padding: 14px; background: rgba(0,0,0,0.1); color: var(--text); border: 1px solid rgba(0,0,0,0.1); border-radius: 12px; font-weight: 600; cursor: pointer; font-size: 1rem;">Back</button>
                <button type="submit" id="submitBtn" data-i18n="register_submit" style="flex:1; padding: 14px; background: #34C759; color: #fff; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; font-size: 1rem;">Register</button>
            </div>
        </div>
    </form>
"""

# Fix replace logic for html string
text = re.sub(r'<form id="registerForm" enctype="multipart/form-data">.*?</form>', lambda m: html_form_new, text, flags=re.DOTALL)


auto_login_js = r"""        registerForm.onsubmit = async function(e) {
            e.preventDefault();
            const lang = window.I18N ? window.I18N.getCurrentLang() : 'en';
            const dict = window.I18N_MESSAGES || {};
            const first = FirstName.value.trim(), last = LastName.value.trim(), pwd = Password.value, confirmPwd = ConfirmPassword.value;
            
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(Email.value.trim())) { message.innerHTML = '<div class="message error">❌ Please enter a valid email address</div>'; goToStep(2); return; }
            if (PhoneNumber.value.trim().replace(/\D/g, '').length < 10) { message.innerHTML = '<div class="message error">❌ Please enter a valid phone number</div>'; goToStep(2); return; }
            if (!(/[a-z]/.test(pwd) && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && pwd.length >= 8)) { message.innerHTML = '<div class="message error">❌ Password must contain at least 8 characters with uppercase, lowercase and number</div>'; goToStep(2); return; }
            if (pwd !== confirmPwd) { message.innerHTML = '<div class="message error">' + ((dict.register_password_mismatch && dict.register_password_mismatch[lang]) || '❌ Passwords do not match') + '</div>'; goToStep(2); return; }
            if (!UserType.value) { message.innerHTML = '<div class="message error">' + ((dict.register_select_user_type_error && dict.register_select_user_type_error[lang]) || '❌ Please select user type') + '</div>'; goToStep(1); return; }

            submitBtn.disabled = true;
            const originalSubBtnTxt = submitBtn.textContent;
            submitBtn.textContent = (dict.register_registering && dict.register_registering[lang]) || 'Registering...';
            submitBtn.style.opacity = '0.7';

            const formData = new FormData();
            formData.append('FullName', (first + ' ' + last).trim());
            formData.append('Email', Email.value.trim());
            formData.append('PhoneNumber', PhoneNumber.value.trim());
            formData.append('IDCardNumber', IDCardNumber.value.trim());
            formData.append('Password', pwd);
            formData.append('UserType', UserType.value);
            if (frontFile) { formData.append('IDCardFront', frontFile); formData.append('IDCardBack', frontFile); }

            try {
                const res = await fetch(API_URL + '/users/register', { method: 'POST', body: formData });
                const data = await res.json();
                if (res.ok) {
                    message.innerHTML = '<div class="message success" style="background:#d4edda; color:#155724; padding:10px; border-radius:8px; margin-bottom:15px; border:1px solid #c3e6cb;">✅ ' + data.message + ' <br>🔄 Logging in...</div>';
                    
                    try {
                        const loginRes = await fetch(API_URL + '/users/login', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: Email.value.trim(), password: pwd })
                        });
                        const loginData = await loginRes.json();
                        if (loginRes.ok) {
                            localStorage.setItem('user', JSON.stringify(loginData.user));
                            location.href = 'index.html';
                        } else {
                            location.href = 'login.html';
                        }
                    } catch(e) {
                        location.href = 'login.html';
                    }
                } else { 
                    message.innerHTML = '<div class="message error">❌ ' + (data.error || '') + '</div>'; 
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalSubBtnTxt;
                    submitBtn.style.opacity = '1';
                }
            } catch (error) {
                message.innerHTML = '<div class="message error">' + ((dict.register_network_error && dict.register_network_error[lang]) || '❌ Network error') + '</div>';
                submitBtn.disabled = false;
                submitBtn.textContent = originalSubBtnTxt;
                submitBtn.style.opacity = '1';
            }
        };

        function goToStep(step) {
            if(step === 2) {
                if(!UserType.value) { document.getElementById('step1TypeError').style.display='block'; return; }
                document.getElementById('step1TypeError').style.display='none';
                const vFirst = /^[a-zA-Z]+$/.test(FirstName.value.trim());
                const vLast = /^[a-zA-Z]+$/.test(LastName.value.trim());
                if(!vFirst || !vLast || !FirstName.value || !LastName.value) {
                    alert('Please provide valid first and last names (letters only).');
                    return;
                }
            }
            if(step === 3) {
                const pwd = document.getElementById('Password').value;
                const cpwd = document.getElementById('ConfirmPassword').value;
                const em = document.getElementById('Email').value.trim();
                const ph = document.getElementById('PhoneNumber').value.trim().replace(/\D/g,'');
                
                if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { alert('Please enter a valid email address'); return; }
                if(ph.length < 10) { alert('Valid phone number required'); return; }
                if(!(/[a-z]/.test(pwd) && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && pwd.length >= 8)) {
                    alert('Password must contain at least 8 characters with uppercase, lowercase and number'); return;
                }
                if(pwd !== cpwd) { alert('Passwords do not match'); return; }
            }
            
            document.querySelectorAll('.wizard-step').forEach(el => el.style.display = 'none');
            document.getElementById('step' + step).style.display = 'block';
            
            document.getElementById('stepCounter').innerText = step;
            document.getElementById('wizardProgressBar').style.width = (step * 33.33) + '%';
        }
"""

text = re.sub(r'registerForm\.onsubmit\s*=\s*async\s*function\(e\)\s*\{.*?\};(?=\s*</script>)', lambda m: auto_login_js, text, flags=re.DOTALL)
text = re.sub(r"<script>\s*document\.addEventListener\('DOMContentLoaded', function\(\) \{(?:.*?)</script>", "<script>\n/* Replaced dynamically */\n</script>", text, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print("Rewritten securely!")

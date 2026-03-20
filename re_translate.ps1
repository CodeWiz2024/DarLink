$myProps = "c:\xampp\htdocs\PFE.2.0.0.0\client\my-property.html"
$content = Get-Content $myProps -Raw

# Replace text with data-i18n wrappers
$content = $content -replace "<h1>.*?My Properties</h1>", "<h1><i class=`"fa-solid fa-house`" style=`"color: var(--primary);`"></i> <span data-i18n=`"my-props-title`">My Properties</span></h1>"
$content = $content -replace "<p>Manage your vacation rental properties</p>", "<p data-i18n=`"my-props-desc`">Manage your vacation rental properties</p>"
$content = $content -replace "Add New(\s*?)</a>", "<span data-i18n=`"btn-add-new`">Add New</span>$1</a>"
$content = $content -replace "Loading your properties...", "<span data-i18n=`"loading-props`">Loading your properties...</span>"
$content = $content -replace "No Properties Yet</h3>", "<h3 style=`"color: var(--text-main); margin-bottom: 8px;`" data-i18n=`"no-props-yet`">No Properties Yet</h3>"
$content = $content -replace "<p style=`"color: var(--text-muted); margin-bottom: 20px;`">Start by adding your first property!</p>", "<p style=`"color: var(--text-muted); margin-bottom: 20px;`" data-i18n=`"start-adding-prop`">Start by adding your first property!</p>"

# Actions replacement in JS template literal
$content = $content -replace "\`\$\{p.AvailabilityStatus === 'Active' \? 'Deactivate' : 'Activate'\}\`", "<span data-i18n=`"action-`\$\{p.AvailabilityStatus === 'Active' \? 'deactivate' : 'activate'\}\`">`\$\{p.AvailabilityStatus === 'Active' \? 'Deactivate' : 'Activate'\}\`</span>"
$content = $content -replace "Edit(\s*?)</button>", "<span data-i18n=`"action-edit`">Edit</span>$1</button>"
$content = $content -replace "Packages(\s*?)</button>", "<span data-i18n=`"action-packages`">Packages</span>$1</button>"
$content = $content -replace "Messages(\s*?)</button>", "<span data-i18n=`"action-messages`">Messages</span>$1</button>"
$content = $content -replace "Delete(\s*?)</button>", "<span data-i18n=`"action-delete`">Delete</span>$1</button>"

Set-Content -Path $myProps -Value $content -Encoding UTF8

$bookings = "c:\xampp\htdocs\PFE.2.0.0.0\client\bookings.html"
$contentBk = Get-Content $bookings -Raw

$contentBk = $contentBk -replace "<h1>.*?My Bookings</h1>", "<h1><i class=`"fa-regular fa-calendar-check`" style=`"color: var(--primary);`"></i> <span data-i18n=`"my-bk-title`">My Bookings</span></h1>"
$contentBk = $contentBk -replace "<p>Manage and review your renters</p>", "<p data-i18n=`"my-bk-desc`">Manage and review your renters</p>"
$contentBk = $contentBk -replace "Loading bookings...", "<span data-i18n=`"loading-bk`">Loading bookings...</span>"
$contentBk = $contentBk -replace "No Bookings Yet</h3>", "<h3 style=`"color: var(--text-main); margin-bottom: 8px;`" data-i18n=`"no-bk-yet`">No Bookings Yet</h3>"
$contentBk = $contentBk -replace "When renters book your properties, they'll appear here.</p>", "<p style=`"color: var(--text-muted);`" data-i18n=`"when-renters-bk`">When renters book your properties, they'll appear here.</p>"

# Bookings JS Template
$contentBk = $contentBk -replace "<div class=`"detail-label`">Check-in</div>", "<div class=`"detail-label`" data-i18n=`"bk-checkin`">Check-in</div>"
$contentBk = $contentBk -replace "<div class=`"detail-label`">Check-out</div>", "<div class=`"detail-label`" data-i18n=`"bk-checkout`">Check-out</div>"
$contentBk = $contentBk -replace "<div class=`"detail-label`">Nights</div>", "<div class=`"detail-label`" data-i18n=`"bk-nights`">Nights</div>"
$contentBk = $contentBk -replace "<div class=`"detail-label`">Total Price</div>", "<div class=`"detail-label`" data-i18n=`"bk-total-price`">Total Price</div>"
$contentBk = $contentBk -replace "View Profile(\s*?)</a>", "<span data-i18n=`"bk-view-profile`">View Profile</span>$1</a>"
$contentBk = $contentBk -replace "Review</button>`"\)", "<span data-i18n=`"bk-review`">Review</span></button>`"\)"
$contentBk = $contentBk -replace "Reviewed</span>'", "<span data-i18n=`"bk-reviewed`">Reviewed</span></span>'"

# Reviews Modal
$contentBk = $contentBk -replace "Review Renter</h2>", "<span data-i18n=`"review-renter-title`">Review Renter</span></h2>"
$contentBk = $contentBk -replace "placeholder=`"Describe your experience with this renter...`"", "placeholder=`"Describe your experience with this renter...`" data-i18n-placeholder=`"review-ph`""
$contentBk = $contentBk -replace "Cancel</button>", "<span data-i18n=`"btn-cancel`">Cancel</span></button>"
$contentBk = $contentBk -replace "Submit Review</button>", "<span data-i18n=`"btn-submit-review`">Submit Review</span></button>"

Set-Content -Path $bookings -Value $contentBk -Encoding UTF8

$stats = "c:\xampp\htdocs\PFE.2.0.0.0\client\Statistics.html"
$contentSt = Get-Content $stats -Raw

$contentSt = $contentSt -replace "<h1>.*?Statistics</h1>", "<h1><i class=`"fa-solid fa-chart-line`" style=`"color: var(--primary);`"></i> <span data-i18n=`"dash-title-stats`">Statistics</span></h1>"
$contentSt = $contentSt -replace "<p>Overview of your properties performance</p>", "<p data-i18n=`"dash-subtitle-stats`">Overview of your properties performance</p>"
$contentSt = $contentSt -replace "Total Properties</div>", "<span data-i18n=`"stat-total-props`">Total Properties</span></div>"
$contentSt = $contentSt -replace ">Active</div>", " data-i18n=`"stat-active-props`">Active</div>"
$contentSt = $contentSt -replace ">Inactive</div>", " data-i18n=`"stat-inactive-props`">Inactive</div>"
$contentSt = $contentSt -replace "Total Bookings</div>", "<span data-i18n=`"stat-total-bookings`">Total Bookings</span></div>"

$contentSt = $contentSt -replace "<h2>.*?Properties by Type</h2>", "<h2><i class=`"fa-solid fa-chart-pie`" style=`"color: var(--primary); margin-right: 8px;`"></i> <span data-i18n=`"stat-props-type`">Properties by Type</span></h2>"
$contentSt = $contentSt -replace ">No properties yet</p>", " data-i18n=`"stat-no-props`">No properties yet</p>"

Set-Content -Path $stats -Value $contentSt -Encoding UTF8

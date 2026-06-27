const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            alert(error.message);
            return;
        }

        window.location.href = "dashboard.html";
    });
}

async function loadDashboard() {
    const { data } = await supabase
        .from('applications')
        .select('*');

    if (!data) return;

    const totalBox = document.getElementById('totalApplications');
    const shortlistedBox = document.getElementById('shortlistedCount');
    const selectedBox = document.getElementById('selectedCount');
    const rejectedBox = document.getElementById('rejectedCount');

    if (totalBox) totalBox.innerText = data.length;
    if (shortlistedBox) shortlistedBox.innerText =
        data.filter(x => x.shortlisted).length;

    if (selectedBox) selectedBox.innerText =
        data.filter(x => x.selected).length;

    if (rejectedBox) rejectedBox.innerText =
        data.filter(x => x.rejected).length;

    const grouped = {};

    data.forEach(app => {
        if (!grouped[app.ward]) {
            grouped[app.ward] = {
                applications: 0,
                shortlisted: 0,
                selected: 0
            };
        }

        grouped[app.ward].applications++;

        if (app.shortlisted) grouped[app.ward].shortlisted++;
        if (app.selected) grouped[app.ward].selected++;
    });

    const wardTable = document.getElementById('wardAnalytics');

    if (wardTable) {
        wardTable.innerHTML = Object.entries(grouped).map(([ward, stats]) => `
            <tr>
                <td>${ward}</td>
                <td>${stats.applications}</td>
                <td>${stats.shortlisted}</td>
                <td>${stats.selected}</td>
            </tr>
        `).join('');
    }
}

function getStatus(app) {
    if (app.selected) return "Selected";
    if (app.shortlisted) return "Shortlisted";
    if (app.rejected) return "Rejected";
    return "Pending";
}

function renderRows(data) {
    return data.map(app => `
        <tr>
            <td>${app.full_name}</td>
            <td>${app.ward}</td>
            <td>${app.lga}</td>
            <td>${app.skill_type}</td>
            <td>${app.empowerment_choice}</td>
            <td>
                <a href="${app.skill_evidence_url}" target="_blank">Skill</a><br>
                <a href="${app.passport_url}" target="_blank">Passport</a>
            </td>
            <td>${getStatus(app)}</td>
            <td>
                <button class="btn btn-sm btn-primary mb-1"
                    onclick="shortlist('${app.id}')">
                    Shortlist
                </button>

                <button class="btn btn-sm btn-success mb-1"
                    onclick="selectBeneficiary('${app.id}','${app.ward}')">
                    Select
                </button>

                <button class="btn btn-sm btn-danger"
                    onclick="rejectApplicant('${app.id}')">
                    Reject
                </button>
            </td>
        </tr>
    `).join('');
}

async function loadApplications(filters = {}) {
    let query = supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });

    if (filters.name) {
        query = query.ilike('full_name', `%${filters.name}%`);
    }

    if (filters.ward) {
        query = query.ilike('ward', `%${filters.ward}%`);
    }

    if (filters.lga) {
        query = query.ilike('lga', `%${filters.lga}%`);
    }

    const { data } = await query;

    const table = document.getElementById('applicationsTable');

    if (table && data) {
        table.innerHTML = renderRows(data);
    }
}

window.shortlist = async (id) => {
    await supabase
        .from('applications')
        .update({
            shortlisted: true,
            rejected: false
        })
        .eq('id', id);

    location.reload();
};

window.rejectApplicant = async (id) => {
    await supabase
        .from('applications')
        .update({
            rejected: true,
            shortlisted: false,
            selected: false
        })
        .eq('id', id);

    location.reload();
};

window.selectBeneficiary = async (id, ward) => {
    const { count } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('ward', ward)
        .eq('selected', true);

    if (count >= 2) {
        alert("This ward already has 2 selected beneficiaries.");
        return;
    }

    await supabase
        .from('applications')
        .update({
            selected: true,
            shortlisted: true,
            rejected: false
        })
        .eq('id', id);

    location.reload();
};

const filterBtn = document.getElementById('applyFilter');

if (filterBtn) {
    filterBtn.addEventListener('click', () => {
        loadApplications({
            name: document.getElementById('searchName').value,
            ward: document.getElementById('filterWard').value,
            lga: document.getElementById('filterLGA').value
        });
    });
}

const exportBtn = document.getElementById('exportCSV');

if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
        const { data } = await supabase
            .from('applications')
            .select('*');

        let csv =
            "Name,Ward,LGA,Skill,Choice,Status\n";

        data.forEach(app => {
            csv += `${app.full_name},${app.ward},${app.lga},${app.skill_type},${app.empowerment_choice},${getStatus(app)}\n`;
        });

        const blob = new Blob([csv], {
            type: "text/csv"
        });

        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "applications.csv";
        a.click();
    });
}

async function printReport(type) {
    let query = supabase
        .from('applications')
        .select('*');

    if (type === "shortlisted") {
        query = query.eq('shortlisted', true);
    }

    if (type === "selected") {
        query = query.eq('selected', true);
    }

    const { data } = await query;

    let html = `
        <h2>CSDA ${type.toUpperCase()} REPORT</h2>
        <table border="1" width="100%" cellspacing="0" cellpadding="8">
            <tr>
                <th>Name</th>
                <th>Ward</th>
                <th>LGA</th>
                <th>Skill</th>
                <th>Choice</th>
            </tr>
    `;

    data.forEach(app => {
        html += `
            <tr>
                <td>${app.full_name}</td>
                <td>${app.ward}</td>
                <td>${app.lga}</td>
                <td>${app.skill_type}</td>
                <td>${app.empowerment_choice}</td>
            </tr>
        `;
    });

    html += `</table>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.print();
}

const printShortlisted = document.getElementById('printShortlisted');
const printSelected = document.getElementById('printSelected');

if (printShortlisted) {
    printShortlisted.onclick = () => printReport("shortlisted");
}

if (printSelected) {
    printSelected.onclick = () => printReport("selected");
}

loadDashboard();
loadApplications();
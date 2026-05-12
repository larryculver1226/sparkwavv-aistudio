
async function test() {
    try {
        const res = await fetch('http://localhost:3000/api/admin/users');
        console.log('Status:', res.status);
        const data = await res.json();
        console.log('Users Count:', data.users?.length);
        if (data.users && data.users.length > 0) {
            console.log('First user:', data.users[0].email);
        }
    } catch (e: any) {
        console.error('Error fetching users:', e.message);
    }
}
test();

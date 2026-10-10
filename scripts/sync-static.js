// 将 app/ 下的静态文件同步到 public/
// bundle.js 由 webpack 构建直接输出到 public/dist/
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const appDir = path.join(root, 'app');
const publicDir = path.join(root, 'public');

function copyFile(src, dest) {
	fs.mkdirSync(path.dirname(dest), { recursive: true });
	fs.copyFileSync(src, dest);
	console.log('copy:', path.relative(root, src), '->', path.relative(root, dest));
}

function copyDir(src, dest) {
	fs.mkdir(dest, { recursive: true });
	for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
		const s = path.join(src, entry.name);
		const d = path.join(dest, entry.name);
		if (entry.isDirectory()) {
			copyDir(s, d);
		} else {
			copyFile(s, d);
		}
	}
}

copyFile(path.join(appDir, 'home.html'), path.join(publicDir, 'index.html'));
copyFile(path.join(appDir, 'editor.html'), path.join(publicDir, 'editor.html'));
copyFile(path.join(appDir, 'admin.html'), path.join(publicDir, 'admin.html'));
copyFile(path.join(appDir, 'manifest.json'), path.join(publicDir, 'manifest.json'));
copyFile(path.join(appDir, 'service-worker.js'), path.join(publicDir, 'service-worker.js'));
copyDir(path.join(appDir, 'images'), path.join(publicDir, 'images'));
console.log('静态资源同步完成');

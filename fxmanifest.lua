fx_version 'cerulean'
game 'gta5'

dependency 'yarn'

ui_page 'html/index.html'

files {
    'html/index.html',
    'html/**/*',
}

client_script {
    'client/*.js',
}

server_script {
	'server/*.js'
}
from app import url


url_routes = {
        'api':fr'{url}',
        'index':fr'{url}/',
        'parcels':{
            'get_all':fr'{url}/parcels',
            'add_parcel':fr'{url}/parcel/add',
            'update_parcel':fr'{url}/parcel/update/<int:id>',
            'delete_parcel':fr'{url}/parcel/delete/<int:id>',
            'log':fr'{url}parcels/<int:id>/logs',
        },
        'user':{
            'login':fr'{url}/api/v1/login',
            'register':fr'{url} ',
            # 'update_parcel':fr'{url}/user/update/<int:id>',
            # 'delete_parcel':fr'{url}/user/delete/<int:id>'
        },
    }


routes = {
        'api':fr'/api/v1',
        'index':fr'/',
        'parcels':{
            'get_all':fr'/parcels',
            'add_parcel':fr'/parcel/add',
            'update_parcel':fr'/parcel/update/<int:id>',
            'delete_parcel':fr'/parcel/delete/<int:id>'
        },
        'user':{
            'get_all':fr'/users',
            'add_parcel':fr'/user/add',
            'update_parcel':fr'/user/update/<int:id>',
            'delete_parcel':fr'/user/delete/<int:id>'
        },
         'transaction-log':{
            'get_all':fr'/transactions',
            'update_parcel':fr'/transaction/update/<int:id>',
            'delete_parcel':fr'/transaction/delete/<int:id>'
        }
    }
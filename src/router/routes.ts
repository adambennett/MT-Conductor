import { RouteConfig } from 'vue-router'
import Profile from 'src/model/Profile';

const routes: RouteConfig[] = [
    {
        path: '/',
        component: () => import('pages/Splash.vue'),
        meta: {
            title: () => 'Conductor'
        }
    },
    {
        path: '/profiles',
        component: () => import('pages/Profiles.vue'),
        meta: {
            title: () => 'Conductor'
        }
    },
    {
        path: '/manager',
        component: () => import('pages/Manager.vue'),
        meta: {
            title: () => 'Conductor - ' + Profile.getActiveProfile().getProfileName()
        }
    },
    {
        path: '/config-editor',
        component: () => import('pages/ConfigEditor.vue'),
        meta: {
            title: () => 'Conductor - ' + Profile.getActiveProfile().getProfileName()
        }
    },
];

// Always leave this as last one
if (process.env.MODE !== 'ssr') {
    routes.push({
        path: '*',
        component: () => import('pages/Error404.vue'),
    });
}

export default routes;

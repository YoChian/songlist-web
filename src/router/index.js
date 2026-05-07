import { createRouter, createWebHistory } from "vue-router";
import StreamerDirectory from "../views/StreamerDirectory.vue";
import StreamerPage from "../views/StreamerPage.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: StreamerDirectory,
    },
    {
      path: "/:routeName",
      name: "streamer",
      component: StreamerPage,
      props: (route) => ({
        routeName: route.params.routeName,
      }),
    },
    {
      path: "/:pathMatch(.*)*",
      name: "not-found",
      component: StreamerDirectory,
      props: (route) => ({
        notFound: true,
        missingRouteName: Array.isArray(route.params.pathMatch)
          ? route.params.pathMatch.join("/")
          : route.params.pathMatch,
      }),
    },
  ],
});

export default router;

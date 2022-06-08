export default {
  async fetch(request) {
    if (request.method !== 'GET') {
        return new Response("Only GET is supported", { status: 400 })
    }
    console.log("HERE")
    console.log(request.params)
    console.log(request.url)
    var pathname = url.parse(request.url).pathname;
    console.log(pathname)
    console.log("BYE")
    return new Response("Hello World!");
    /**
     * headers: {
        'content-type': 'application/json;charset=UTF-8',
      },
     */
  },
};

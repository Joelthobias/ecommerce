function addtocart(proid) {
  console.log('hhhhfhhhhhhhhhhhh'+proid);
  $.ajax({
    url: "/add-to-cart/" + proid,
    method: "get",
    success:(response)=>{
      if(response.status){
        let count=$('#cart-count').html()
        let co=$('#cart-coun').html()
        co=parseInt(co)+1 
        $("#cart-coun").html(co)
        count=parseInt(count)+1 
        $("#cart-count").html(count)
      }
    }
  })
}


$(function () {
  'use strict'

  $('[data-toggle="offcanvas"]').on('click', function () {
    $('.offcanvas-collapse').toggleClass('open')
  })
})


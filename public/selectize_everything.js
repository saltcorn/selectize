add_apply_showif_plugin(() => {
    $('select.selectizable').removeClass('selectizable').selectize({
        plugins: ["remove_button"],
        //allowEmptyOption: true,
    });
})
add_apply_showif_plugin(() => {
    $('select.selectizable').removeClass('selectizable').selectize({
        allowEmptyOption: true,
    });
})
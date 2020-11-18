vaine-widget
===============================

Visual Analytics for Natural Experiments

Installation
------------

To install use pip:

    $ pip install vaine
    $ jupyter nbextension enable --py --sys-prefix vaine

To install for jupyterlab

    $ jupyter labextension install vaine

For a development installation (requires npm),

    $ git clone https://github.com/PNNL/vaine-widget.git
    $ cd vaine-widget
    $ pip install -e .
    $ jupyter nbextension install --py --symlink --sys-prefix vaine
    $ jupyter nbextension enable --py --sys-prefix vaine

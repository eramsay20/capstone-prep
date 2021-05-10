from app.models import db, Watchlist_Item

def seed_watchlist_items():
    demo_watchlist_item_1 = Watchlist_Item(
        watchlist_id = 1,
        ticker = 'AAPL',
    )

    demo_watchlist_item_2 = Watchlist_Item(
        watchlist_id = 1,
        ticker = 'TSLA',
    )

    demo_watchlist_item_3 = Watchlist_Item(
        watchlist_id = 1,
        ticker = 'FB',
    )

    demo_watchlist_item_4 = Watchlist_Item(
        watchlist_id = 1,
        ticker = 'NFLX',
    )

    demo_watchlist_item_5 = Watchlist_Item(
        watchlist_id = 1,
        ticker = 'AMZN',
    )

    db.session.add(demo_watchlist_item_1)
    db.session.add(demo_watchlist_item_2)
    db.session.add(demo_watchlist_item_3)
    db.session.add(demo_watchlist_item_4)
    db.session.add(demo_watchlist_item_5)
    db.session.commit()


def undo_watchlist_items():
    db.session.execute('TRUNCATE watchlist_items RESTART IDENTITY CASCADE;')
    db.session.commit()
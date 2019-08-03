# Samples Manager

Manager needs to keep track of which samples are `needed` vs `notNeeded`

## Triggers for loading samples
shouldn't have to keep track of these, because everyone needs to go through
the `getSample` function.

- enter room
- new sample assign to sample pad
- instrument added


## Triggers for unloading samples
- leave room
- new sample assign to sample pad
- pad cleared
- instrument deleted
